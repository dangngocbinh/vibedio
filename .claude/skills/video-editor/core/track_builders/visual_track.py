"""Visual track builder - creates main video track with scene clips and title cards."""
from typing import Dict, Any, List, Optional
import opentimelineio as otio

from utils.timing_calculator import TimingCalculator
from core.asset_resolver import AssetResolver


class VisualTrackBuilder:
    """Builds the main visual track with scene clips and title cards."""

    def __init__(self, fps: int = 30, project_dir: str = "", asset_resolver: Optional[AssetResolver] = None):
        """
        Initialize VisualTrackBuilder.

        Args:
            fps: Frames per second
            project_dir: Project directory path
            asset_resolver: Asset resolver instance (optional)
        """
        self.fps = fps
        self.timing = TimingCalculator(fps)
        self.asset_resolver = asset_resolver or AssetResolver(project_dir) if project_dir else None
        self.target_aspect_ratio = 16 / 9  # Default, updated from script metadata

    def build(self, script: Dict[str, Any], resources: Dict[str, Any]) -> otio.schema.Track:
        """
        Build main visual track with scene clips and title cards.

        Args:
            script: Parsed script.json
            resources: Parsed resources.json

        Returns:
            OTIO Track with video clips
        """
        # Update aspect ratio from script metadata
        ratio = script.get('metadata', {}).get('ratio', '16:9')
        self.target_aspect_ratio = self._parse_aspect_ratio(ratio)

        track = otio.schema.Track(name="Main Visual", kind=otio.schema.TrackKind.Video)

        # Check if script uses sections (new format) or scenes (legacy)
        if 'sections' in script:
            self._build_from_sections(track, script, resources)
        else:
            self._build_from_scenes(track, script, resources)

        return track

    def _build_from_sections(
        self,
        track: otio.schema.Track,
        script: Dict[str, Any],
        resources: Dict[str, Any]
    ) -> None:
        """Build track from sections structure with synchronization and transition padding."""
        sections = script.get('sections', [])
        
        # Flatten and prepare scenes
        all_scenes_flat = []
        for s_idx, section in enumerate(sections):
            section_scenes = section.get('scenes', [])
            for sc_idx, scene in enumerate(section_scenes):
                scene_data = scene.copy()
                scene_data['_section_id'] = section.get('id', f'section{s_idx}')
                scene_data['_is_first_in_section'] = (sc_idx == 0)
                scene_data['_section_title_card'] = section.get('titleCard', {}) if sc_idx == 0 else {}
                scene_data['_section_title'] = section.get('name', section.get('title', f'Section {s_idx+1}'))
                all_scenes_flat.append(scene_data)

        current_time = 0.0

        for idx, scene in enumerate(all_scenes_flat):
            scene_id = scene.get('id', f'scene_{idx}')
            
            # 1. Calculate Sync Duration (The time this scene occupies on the FINAL timeline)
            target_start_time = scene.get('startTime')
            if target_start_time is None:
                target_start_time = current_time

            if idx + 1 < len(all_scenes_flat):
                next_start = all_scenes_flat[idx+1].get('startTime')
                if next_start is not None:
                    sync_duration = next_start - max(current_time, target_start_time)
                else:
                    sync_duration = scene.get('duration', 5.0)
            else:
                # Last scene
                if 'endTime' in scene and 'startTime' in scene:
                    sync_duration = scene['endTime'] - current_time # Continuity
                    if current_time < scene['startTime']:
                         sync_duration = scene['endTime'] - current_time
                else:
                    sync_duration = scene.get('duration', 5.0)

            if sync_duration < 0.5:
                sync_duration = 0.5

            # 2. Calculate Transition Padding
            # Logic: If transition exists, we need extra footage (overlap).
            # Transition after Scene[I] comes from Scene[I]['transition']
            # Transition before Scene[I] comes from Scene[I-1]['transition']
            
            pad_in = 0.0
            pad_out = 0.0
            
            # Check previous transition (for Pad In)
            if idx > 0:
                prev_scene = all_scenes_flat[idx-1]
                prev_trans_config = prev_scene.get('transition', {})
                # Defaults
                if prev_trans_config.get('type', 'crossfade') not in ('cut', 'none'):
                     prev_trans_dur = prev_trans_config.get('duration', 0.5)
                     pad_in = prev_trans_dur / 2.0

            # Check next transition (for Pad Out)
            if idx < len(all_scenes_flat) - 1:
                curr_trans_config = scene.get('transition', {})
                if curr_trans_config.get('type', 'crossfade') not in ('cut', 'none'):
                     curr_trans_dur = curr_trans_config.get('duration', 0.5)
                     pad_out = curr_trans_dur / 2.0

            # 3. Handle Section Title Card
            reserved_sync = 0.0
            title_card_config = scene.get('_section_title_card', {})
            
            if title_card_config.get('enabled', False) and not title_card_config.get('asOverlay', False):
                title_text = scene.get('_section_title', '')
                mock_section = {'title': title_text}
                title_clip = self._create_section_title_card(mock_section, title_card_config)
                
                if title_clip:
                    # Title card also needs padding?
                    # If Title Card transitions to Scene Clip?
                    # Assumption: Title Card -> Scene Clip transition is implied by start of scene?
                    # Or does 'pad_in' apply to Title Card?
                    # Complex. Let's apply 'pad_in' to Title Card, and 'internal pad' between Title and Scene?
                    # Simplify: Apply 'pad_in' to Title Card.
                    # Apply 'pad_out' to Scene Clip.
                    # Internal transition Title -> Scene? We assume simple cut for now or standard.
                    # If user wants transition Title -> Scene, we need internal logic.
                    # For now, let's just make Title Card occupy its sync duration.
                    
                    track.append(title_clip)
                    dur = title_clip.duration().to_seconds()
                    reserved_sync = dur
                    current_time += dur
            
            # 4. Create Scene Clips with Padding
            clip_sync_duration = sync_duration - reserved_sync
            if clip_sync_duration < 0.1: clip_sync_duration = 0.1
            
            # Total duration needed from resource
            total_resource_duration = clip_sync_duration + pad_in + pad_out
            
            scene_clips = self._create_scene_clips(scene_id, scene, resources, total_resource_duration)
            
            for clip in scene_clips:
                track.append(clip)
                # IMPORTANT: We do NOT add clip.duration() (which includes padding) to current_time.
                # We add the SYNC duration.
            
            current_time += clip_sync_duration

            # 5. Add Transition Object
            if idx < len(all_scenes_flat) - 1:
                # We only add transition if valid
                transition = self._create_transition(scene)
                if transition:
                    # Check if clips are long enough (safety)
                    # We intentionally padded them, so they SHOULD be long enough.
                    track.append(transition)

    def _build_from_scenes(
        self,
        track: otio.schema.Track,
        script: Dict[str, Any],
        resources: Dict[str, Any]
    ) -> None:
        """Build track from legacy scenes structure with synchronization and padding."""
        scenes = script.get('scenes', [])
        current_time = 0.0

        for idx, scene in enumerate(scenes):
            scene_id = scene.get('id', f'scene{idx}')
            
            # 1. Sync Duration
            target_end_time = None
            if idx + 1 < len(scenes):
                next_start = scenes[idx+1].get('startTime')
                target_end_time = next_start
            
            if target_end_time:
                sync_duration = target_end_time - current_time
            else:
                if 'endTime' in scene:
                    sync_duration = scene['endTime'] - current_time
                else:
                    sync_duration = scene.get('duration', 5.0)

            if sync_duration < 0.5: sync_duration = 0.5
            
            # 2. Padding
            pad_in = 0.0
            pad_out = 0.0
            
            if idx > 0:
                prev_trans = scenes[idx-1].get('transition', {})
                if prev_trans.get('type', 'crossfade') not in ('cut', 'none'):
                     duration = prev_trans.get('duration', 0.5)
                     pad_in = duration / 2.0
            
            if idx < len(scenes) - 1:
                curr_trans = scene.get('transition', {})
                if curr_trans.get('type', 'crossfade') not in ('cut', 'none'):
                     duration = curr_trans.get('duration', 0.5)
                     pad_out = duration / 2.0

            # 3. Create Clips
            total_dur = sync_duration + pad_in + pad_out
            scene_clips = self._create_scene_clips(scene_id, scene, resources, total_dur)

            for clip in scene_clips:
                track.append(clip)
            
            current_time += sync_duration

            # 4. Transition
            if idx < len(scenes) - 1:
                transition = self._create_transition(scene)
                if transition:
                    track.append(transition)

    def _create_section_title_card(
        self,
        section: Dict[str, Any],
        title_card_config: Dict[str, Any]
    ) -> Optional[otio.schema.Clip]:
        """
        Create fullscreen title card for section.
        """
        text = title_card_config.get('text', section.get('title', ''))
        duration = title_card_config.get('duration', 2.0)
        style = title_card_config.get('style', 'default')

        if not text:
            return None

        # Create clip with MissingReference (component clip)
        media_ref = otio.schema.MissingReference()
        source_range = self.timing.create_time_range(0, duration)

        clip = otio.schema.Clip(
            name=f"Title Card: {text[:20]}",
            media_reference=media_ref,
            source_range=source_range
        )

        # Add Remotion component metadata
        clip.metadata['remotion_component'] = 'SectionTitleCard'
        clip.metadata['props'] = {
            'text': text,
            'style': style,
            'subtitle': title_card_config.get('subtitle', ''),
        }

        return clip

    def _create_scene_clips(
        self,
        scene_id: str,
        scene: Dict[str, Any],
        resources: Dict[str, Any],
        duration: float
    ) -> List[otio.schema.Clip]:
        """
        Create clips for a scene using selectedResourceIds array or fallback to resources.
        """
        clips = []

        # Check for selectedResourceIds (plural, array)
        selected_ids = scene.get('selectedResourceIds', [])

        if selected_ids and isinstance(selected_ids, list) and len(selected_ids) > 0:
            # Use selected resources
            clips = self._create_clips_from_selected_ids(selected_ids, scene, resources, duration)
        else:
            # Fallback to searching resources by scene ID
            clips = self._create_clips_from_resources(scene_id, resources, duration)

        # If no clips found, create a placeholder
        if not clips:
            placeholder = self._create_placeholder_clip(scene_id, duration)
            if placeholder:
                clips = [placeholder]

        return clips

    def _create_clips_from_selected_ids(
        self,
        selected_ids: List[str],
        scene: Dict[str, Any],
        resources: Dict[str, Any],
        target_duration: float
    ) -> List[otio.schema.Clip]:
        """
        Create clips from selectedResourceIds array avoiding unnecessary loops.
        """
        clips = []
        candidates = scene.get('resourceCandidates', [])
        
        num_resources = len(selected_ids)
        if num_resources == 0:
            return []
            
        # Divide duration equally among selected resources
        clip_duration = target_duration / num_resources
        
        for i, resource_id in enumerate(selected_ids):
            # Find resource in candidates
            resource = None
            for candidate in candidates:
                if candidate.get('id') == resource_id:
                    resource = candidate
                    break

            # If not in candidates, search in resources.json
            if not resource:
                resource = self._find_resource_by_id(resource_id, resources)

            if resource:
                # Get local path
                local_path = resource.get('localPath')
                if local_path and self.asset_resolver:
                    url = self.asset_resolver.sanitize_for_otio(local_path)
                else:
                    url = resource.get('url', '')

                if url:
                    # Create clip
                    metadata = resource.get('metadata', {})
                    if resource.get('width'):
                        metadata['original_width'] = resource['width']
                    if resource.get('height'):
                        metadata['original_height'] = resource['height']

                    clip = self._create_clip_from_url(
                        url=url,
                        name=f"Scene Resource {i + 1}",
                        duration=clip_duration,
                        metadata=metadata
                    )

                    if clip:
                        clips.append(clip)
        
        return clips

    def _create_clips_from_resources(
        self,
        scene_id: str,
        resources: Dict[str, Any],
        target_duration: float
    ) -> List[otio.schema.Clip]:
        """
        Create clips by searching resources.json for scene ID avoiding unnecessary loops.
        """
        clips = []

        # Get available resources for this scene
        available_videos = self._get_scene_videos(scene_id, resources)
        available_images = self._get_scene_images(scene_id, resources)

        # Prefer videos over images
        available_resources = available_videos if available_videos else available_images

        if not available_resources:
            return clips

        # Use the single best resource if available, or split if we want variety?
        # For auto-matching, using the best match for the entire duration is usually safer
        # unless it's a slideshow style.
        # Strategy: Use the top 1 resource for the full duration
        # This prevents the looping/fragmentation issue reported by user.
        
        resource_entry = available_resources[0]
        resource_url = resource_entry['path']
        
        metadata = {}
        if 'width' in resource_entry:
            metadata['original_width'] = resource_entry['width']
        if 'height' in resource_entry:
            metadata['original_height'] = resource_entry['height']

        path_lower = resource_url.lower()
        is_image = path_lower.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'))
        
        clip = self._create_clip_from_url(
            url=resource_url,
            name=f"{scene_id} {'Image' if is_image else 'Video'} 1",
            duration=target_duration,
            metadata=metadata
        )

        if clip:
            clips.append(clip)

        return clips


    def _find_resource_by_id(
        self,
        resource_id: str,
        resources: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Search for resource by ID in resources.json.

        Args:
            resource_id: Resource ID to find
            resources: Parsed resources.json

        Returns:
            Resource dict or None
        """
        # Search in videos
        videos = resources.get('resources', {}).get('videos', [])
        for video_group in videos:
            for result in video_group.get('results', []):
                if result.get('id') == resource_id:
                    return result

        # Search in images
        images = resources.get('resources', {}).get('images', [])
        for image_group in images:
            for result in image_group.get('results', []):
                if result.get('id') == resource_id:
                    return result

        return None

    def _get_scene_videos(self, scene_id: str, resources: Dict[str, Any]) -> List[str]:
        """Get all LOCAL video paths for a scene, sorted by aspect ratio match."""
        videos = resources.get('resources', {}).get('videos', [])
        for video_group in videos:
            if video_group.get('sceneId') == scene_id:
                results = video_group.get('results', [])
                video_entries = []

                for result in results:
                    # Only use local downloaded files
                    if 'localPath' in result and result['localPath']:
                        if self.asset_resolver:
                            relative_path = self.asset_resolver.sanitize_for_otio(result['localPath'])
                        else:
                            relative_path = result['localPath']

                        width = result.get('width', 1920)
                        height = result.get('height', 1080)

                        video_entries.append({
                            'path': relative_path,
                            'width': width,
                            'height': height,
                            'aspect_ratio': width / height if height > 0 else 1.0
                        })

                return self._sort_by_aspect_ratio(video_entries)

        return []

    def _get_scene_images(self, scene_id: str, resources: Dict[str, Any]) -> List[str]:
        """Get all LOCAL image paths for a scene, sorted by aspect ratio match."""
        images = resources.get('resources', {}).get('images', [])
        for image_group in images:
            if image_group.get('sceneId') == scene_id:
                results = image_group.get('results', [])
                image_entries = []

                for result in results:
                    # Only use local downloaded files
                    if 'localPath' in result and result['localPath']:
                        if self.asset_resolver:
                            relative_path = self.asset_resolver.sanitize_for_otio(result['localPath'])
                        else:
                            relative_path = result['localPath']

                        width = result.get('width', 1920)
                        height = result.get('height', 1080)

                        image_entries.append({
                            'path': relative_path,
                            'width': width,
                            'height': height,
                            'aspect_ratio': width / height if height > 0 else 1.0
                        })

                return self._sort_by_aspect_ratio(image_entries)

        return []

    def _sort_by_aspect_ratio(self, entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Sort entries by aspect ratio match with project target."""
        if not entries:
            return []

        def aspect_ratio_score(entry):
            video_ratio = entry['aspect_ratio']
            distance = abs(video_ratio - self.target_aspect_ratio)
            return distance

        sorted_entries = sorted(entries, key=aspect_ratio_score)
        return sorted_entries

    def _create_clip_from_url(
        self,
        url: str,
        name: str,
        duration: float,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Optional[otio.schema.Clip]:
        """
        Create clip from URL with duration.

        Args:
            url: Media URL
            name: Clip name
            duration: Duration in seconds
            metadata: Optional metadata dict

        Returns:
            OTIO Clip or None
        """
        if not url:
            return None

        media_ref = otio.schema.ExternalReference(target_url=url)
        source_range = self.timing.create_time_range(0, duration)

        clip = otio.schema.Clip(
            name=name,
            media_reference=media_ref,
            source_range=source_range
        )

        if metadata:
            for key, value in metadata.items():
                clip.metadata[key] = value

        return clip

    def _create_placeholder_clip(
        self,
        scene_id: str,
        duration: float
    ) -> Optional[otio.schema.Clip]:
        """Create placeholder clip when no resources found."""
        media_ref = otio.schema.MissingReference()
        source_range = self.timing.create_time_range(0, duration)

        clip = otio.schema.Clip(
            name=f"Placeholder: {scene_id}",
            media_reference=media_ref,
            source_range=source_range
        )

        clip.metadata['placeholder'] = True
        clip.metadata['scene_id'] = scene_id

        return clip

    def _create_transition(self, scene: Dict[str, Any]) -> Optional[otio.schema.Transition]:
        """
        Create transition based on scene config.

        Args:
            scene: Scene dict with optional transition config

        Returns:
            OTIO Transition or None
        """
        transition_config = scene.get('transition', {})
        transition_type = transition_config.get('type', 'crossfade')
        duration = transition_config.get('duration', 0.5)

        # Skip transitions for 'cut' or 'none'
        if transition_type in ('cut', 'none'):
            return None

        duration_frames = self.timing.seconds_to_frames(duration)
        half_duration = duration_frames // 2

        transition = otio.schema.Transition(
            transition_type=otio.schema.TransitionTypes.SMPTE_Dissolve,
            in_offset=otio.opentime.RationalTime(half_duration, self.fps),
            out_offset=otio.opentime.RationalTime(half_duration, self.fps)
        )

        transition.metadata['transition_type'] = transition_type
        transition.metadata['duration_sec'] = duration

        return transition

    def _parse_aspect_ratio(self, ratio_str: str) -> float:
        """
        Parse aspect ratio string to float.

        Args:
            ratio_str: Aspect ratio string like "16:9" or "9:16"

        Returns:
            Aspect ratio as float
        """
        try:
            if ':' in ratio_str:
                parts = ratio_str.split(':')
                return float(parts[0]) / float(parts[1])
            return float(ratio_str)
        except:
            return 16 / 9  # Default
