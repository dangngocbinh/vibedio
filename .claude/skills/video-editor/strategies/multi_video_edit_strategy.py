"""
Multi-Video-Edit Strategy
=========================

Timeline strategy cho video type: multi-video-edit

Đặc điểm:
- Nhiều source videos làm base (separate clips, not combined)
- Audio separate (không combine)
- Title cards cho transitions (Overlay hoặc Insert mode)
- B-roll với smart mode (replace/overlay/skip)
- Captions sync với sourceVideoId

Track Structure:
1. Base Videos (video track - with gaps for inserts)
2. Title Cards (video track - fills gaps in insert mode)
3. B-roll (video track - smart overlay/replace)
4. Captions (video track - overlay)
5. Audio (audio track - separate clips, sync with video splits)
6. Background Music (audio track - optional)

Author: Multi-Video-Edit Feature
Created: 2026-01-28
"""

import opentimelineio as otio
from typing import Dict, Any, List, Optional, Tuple
from strategies.base_strategy import BaseStrategy


class MultiVideoEditStrategy(BaseStrategy):
    """
    Strategy for multi-video-edit type
    
    Handles:
    - Multiple source videos as separate clips
    - Insert Mode: Breaks video flow to insert full-screen title cards
    - Separate audio clips (sync with video splits)
    - Caption sync with time shifting
    """
    
    def populate_tracks(
        self,
        timeline: otio.schema.Timeline,
        script: Dict[str, Any],
        voice_data: Dict[str, Any],  # Not used for this type
        resources: Dict[str, Any]
    ) -> None:
        """
        Build timeline for multi-video-edit with Insert Mode support
        """
        source_videos = script.get('sourceVideos', [])
        scenes = script.get('scenes', [])
        transcript = script.get('transcript', {})
        music_config = script.get('music', {})
        
        if not source_videos:
            raise ValueError("No sourceVideos found in script.json for multi-video-edit")
        
        # 1. Calculate Timeline Structure (Segments & Gaps)
        # Segments: [{'type': 'video', ...}, {'type': 'gap', ...}]
        # Video Logic Map: {'video_1': {start, end, ...}}
        segments, video_logic_map = self._build_segments(source_videos, scenes)
        
        # Calculate time shifts for other tracks
        shift_map = self._build_shift_map(segments)
        
        # 2. Track 1: Main Videos (Base Videos + Insert Title Cards)
        print(f"  Creating main videos track (Merged Insert Mode)...")
        main_track = self._create_main_track(segments, video_logic_map)
        timeline.tracks.append(main_track)
        
        # 3. Track 2: Title Cards (Fill Gaps or Overlay)
        title_scenes = [s for s in scenes if s.get('titleCard', {}).get('enabled', False)]
        if title_scenes:
            print(f"  Creating title cards track with {len(title_scenes)} titles...")
            title_track = self._create_title_card_track(scenes, video_logic_map, shift_map)
            timeline.tracks.append(title_track)
        
        # 4. Track 3: B-roll (Shifted Time)
        total_brolls = sum(len(s.get('brollSuggestions', [])) for s in scenes)
        if total_brolls > 0:
            print(f"  Creating B-roll track with {total_brolls} suggestions...")
            broll_track = self._create_broll_track(scenes, video_logic_map, resources, shift_map)
            timeline.tracks.append(broll_track)
        
        # 5. Track 4: Captions (Shifted Time)
        timestamps = transcript.get('timestamps', [])
        if timestamps:
            print(f"  Creating captions track with {len(timestamps)} words...")
            caption_track = self._create_caption_track(script, transcript, video_logic_map, segments)
            timeline.tracks.append(caption_track)
        
        
        # 6. Track 5: Global Audio (Base Video Audio - Split & Gap)
        # We DISABLE this for now as it causes doubling with video track audio. 
        # The video track will handle audio itself.
        # print(f"  Creating audio track for base videos...")
        # audio_track = self._create_base_audio_track(segments, video_logic_map)
        # timeline.tracks.append(audio_track)
        
        # 7. Track 6: Background Music (Continuous)
        if music_config.get('enabled', True):
            print("  Creating background music track...")
            # Calculate total duration including gaps
            total_duration = sum(s['duration'] for s in segments)
            music_track = self._create_music_track(resources, script, total_duration)
            if music_track:
                timeline.tracks.append(music_track)
                
    def _build_segments(
        self,
        source_videos: List[Dict],
        scenes: List[Dict]
    ) -> Tuple[List[Dict], Dict]:
        """
        Build segments based strictly on the scenes list.
        Each scene results in a segment (either 'video' or 'gap' for title).
        Returns: (segments, video_logic_map)
        """
        # 1. Map Video ID to its Logical Position for global timeline reference
        video_logic_map = {}
        pos = 0.0
        for v in source_videos:
            video_logic_map[v['id']] = {
                'start': pos,
                'end': pos + v['duration'],
                'path': v['path'],
                'audioPath': v.get('audioPath'),
                'hasAudio': v.get('hasAudio', True),
                'duration': v['duration']
            }
            pos += v['duration']
            
        # 2. Map Scenes to Segments
        segments = []
        for i, scene in enumerate(scenes):
            scene_type = scene.get('type', 'video')
            title_config = scene.get('titleCard', {})
            
            # Case 1: Title Scene (Direct type or explicit insert mode)
            is_title = (scene_type == 'title') or (title_config.get('enabled') and title_config.get('mode') == 'insert')
            
            if is_title:
                text = title_config.get('text') or scene.get('content') or scene.get('text', '')
                duration = title_config.get('duration') or scene.get('duration', 3.0)
                
                segments.append({
                    'type': 'gap',
                    'duration': duration,
                    'metadata': {
                        'text': text,
                        'style': title_config.get('style') or scene.get('style', 'minimal'),
                        'scene_id': scene.get('id', f'title_{i}'),
                        'position': title_config.get('position') or scene.get('position', 'center')
                    }
                })
            
            # Case 2: Video Scene
            elif scene_type == 'video':
                vid_id = scene.get('sourceVideoId')
                if vid_id and vid_id in video_logic_map:
                    # Support aliases: start/end vs sourceVideoStartTime/EndTime
                    v_start = scene.get('sourceVideoStartTime', scene.get('start', 0.0))
                    v_end = scene.get('sourceVideoEndTime', scene.get('end', video_logic_map[vid_id]['duration']))
                    
                    # Logic Time (absolute position in joined source videos)
                    logic_start = video_logic_map[vid_id]['start'] + v_start
                    logic_end = video_logic_map[vid_id]['start'] + v_end
                    
                    segments.append({
                        'type': 'video',
                        'logic_start': logic_start,
                        'logic_end': logic_end,
                        'duration': v_end - v_start,
                        'sourceVideoId': vid_id
                    })
            
        return segments, video_logic_map

    def _build_shift_map(self, segments: List[Dict]) -> List[Dict]:
        """
        Build a list of segments with their timeline start times.
        Used to map Logical Time -> Timeline Time.
        """
        mapping = []
        current_timeline_time = 0.0
        
        for seg in segments:
            seg_info = {
                'type': seg['type'],
                'timeline_start': current_timeline_time,
                'duration': seg['duration']
            }
            if seg['type'] == 'video':
                seg_info['logic_start'] = seg['logic_start']
                seg_info['logic_end'] = seg['logic_end']
                
            mapping.append(seg_info)
            current_timeline_time += seg['duration']
                
        return mapping

    def _map_logic_to_timeline(self, logic_time: float, mapping: List[Dict], inclusive: bool = True) -> float:
        """
        Convert Logical Time (source based) to Timeline Time.
        Handles discontinuities by finding the containing video segment.
        """
        for seg in mapping:
            if seg['type'] == 'video':
                # Check if logic_time is within this segment
                if seg['logic_start'] <= logic_time <= seg['logic_end']:
                    return seg['timeline_start'] + (logic_time - seg['logic_start'])
            
            # If we hit a gap AND it's exactly at logic_time, 
            # and we are NOT looking for inclusive (meaning we want the gap start),
            # this is more complex. But for captions/b-roll, logic_time is usually inside a video.
            
        # Fallback: find the last segment before this logic_time
        latest_time = 0.0
        for seg in mapping:
            if seg['type'] == 'video':
                if logic_time > seg['logic_end']:
                    latest_time = seg['timeline_start'] + seg['duration']
                elif logic_time < seg['logic_start']:
                    # It's in a skip zone before this segment
                    return seg['timeline_start']
                    
        return latest_time
    def _create_main_track(
        self,
        segments: List[Dict],
        video_logic_map: Dict
    ) -> otio.schema.Track:
        """
        Create the main video track which includes:
        - Video segments
        - Title Cards (Insert Mode) in place of gaps
        """
        track = self.create_video_track(name="Main Videos")
        
        for seg in segments:
            if seg['type'] == 'video':
                # Map logical range back to specific source video(s)
                self._add_video_clips_for_range(track, seg['logic_start'], seg['logic_end'], video_logic_map)
            elif seg['type'] == 'gap':
                # This is an INSERT Title Card slot
                insert_data = seg.get('metadata', {})
                duration = seg['duration']
                
                # Check if it has title data
                if insert_data.get('text'):
                     # Create Title Card Clip
                    clip = self.create_component_clip(
                        component_name='TitleCard',
                        duration_sec=duration,
                        props={
                            'text': insert_data.get('text', ''),
                            'style': insert_data.get('style', 'minimal'),
                            'position': 'center', # Insert is always center/full
                            'mode': 'insert',
                            'sceneType': 'content' # Simplified
                        },
                        clip_name=f"Title_{insert_data.get('scene_id', 'insert')}"
                    )
                    clip.metadata['componentType'] = 'TitleCard'
                    track.append(clip)
                else:
                    # Fallback to Gap if no data (unlikely)
                    gap = otio.schema.Gap(
                        duration=otio.opentime.from_seconds(duration)
                    )
                    track.append(gap)
                
        return track

    def _create_base_audio_track(
        self,
        segments: List[Dict],
        video_logic_map: Dict
    ) -> otio.schema.Track:
        track = self.create_audio_track(name="Base Audio")
        
        for seg in segments:
            if seg['type'] == 'video':
                self._add_audio_clips_for_range(track, seg['logic_start'], seg['logic_end'], video_logic_map)
            elif seg['type'] == 'gap':
                # Gap in audio track (Silence)
                gap = otio.schema.Gap(
                    duration=otio.opentime.from_seconds(seg['duration'])
                )
                track.append(gap)
                
        return track

    def _add_video_clips_for_range(self, track, start_time, end_time, video_logic_map):
        # Find which videos overlap with [start_time, end_time]
        sorted_videos = sorted(video_logic_map.values(), key=lambda x: x['start'])
        
        for vid in sorted_videos:
            overlap_start = max(vid['start'], start_time)
            overlap_end = min(vid['end'], end_time)
            
            if overlap_start < overlap_end:
                trim_in = overlap_start - vid['start']
                duration = overlap_end - overlap_start
                
                video_path = vid['path']
                if self.asset_resolver:
                    video_path = self.asset_resolver.sanitize_for_otio(video_path)
                    
                clip = self.create_clip_from_url(
                    url=video_path,
                    name=f"part_{vid['path']}",
                    duration_sec=duration,
                )
                
                # Assuming 30fps default for calculation if not specified, but OTIO handles time objects.
                # start_time in clip = trim_in
                clip.source_range = otio.opentime.TimeRange(
                    start_time=otio.opentime.from_seconds(trim_in),
                    duration=otio.opentime.from_seconds(duration)
                )
                
                track.append(clip)

    def _add_audio_clips_for_range(self, track, start_time, end_time, video_logic_map):
        sorted_videos = sorted(video_logic_map.values(), key=lambda x: x['start'])
        
        for vid in sorted_videos:
            overlap_start = max(vid['start'], start_time)
            overlap_end = min(vid['end'], end_time)

            if overlap_start < overlap_end:
                duration = overlap_end - overlap_start
                
                # Check if audio exists
                if not vid.get('hasAudio') or not vid.get('audioPath'):
                    track.append(otio.schema.Gap(duration=otio.opentime.from_seconds(duration)))
                    continue

                trim_in = overlap_start - vid['start']
                
                clip = self.create_clip_from_url(
                    url=vid['audioPath'],
                    name=f"audio_{vid['path']}",
                    duration_sec=duration
                )
                clip.source_range = otio.opentime.TimeRange(
                    start_time=otio.opentime.from_seconds(trim_in),
                    duration=otio.opentime.from_seconds(duration)
                )
                track.append(clip)

    def _create_title_card_track(
        self,
        scenes: List[Dict],
        video_logic_map: Dict,
        shift_map: List[Dict]
    ) -> otio.schema.Track:
        track = self.create_video_track(name="Title Cards")
        clips_to_add = []
        
        for scene in scenes:
            title_config = scene.get('titleCard', {})
            if not title_config.get('enabled', False):
                continue
                
            mode = title_config.get('mode', 'overlay')
            # SKIP Insert Mode (Handled in Main Track)
            if mode == 'insert':
                continue
            
            # Determine Logic Time
            vid_id = scene.get('sourceVideoId')
            if not vid_id or vid_id not in video_logic_map:
                continue
                
            logic_start = video_logic_map[vid_id]['start'] + scene.get('sourceVideoStartTime', 0)
            mode = title_config.get('mode', 'overlay')
            
            # Map to Timeline Time
            # If Insert Mode: We want the time BEFORE the gap shift (inclusive=False)
            # If Overlay Mode: We want the time shifted explicitly (inclusive=True)
            use_inclusive = (mode != 'insert')
            
            timeline_start = self._map_logic_to_timeline(logic_start, shift_map, inclusive=use_inclusive)
            
            # Create Clip
            duration = title_config.get('duration', 2.0)
            
            # If mode is insert, position typically implies full screen or center
            # script.json usually has 'mode', but 'position' might be missing or default to overlay
            props_position = title_config.get('position')
            if not props_position:
                props_position = 'center' if mode == 'insert' else 'overlay'

            clip = self.create_component_clip(
                component_name='TitleCard',
                duration_sec=duration,
                props={
                    'text': title_config.get('text', ''),
                    'style': title_config.get('style', 'minimal'),
                    'position': props_position,
                    'mode': mode, # Pass mode explicitly
                    'sceneType': scene.get('type', 'content')
                },
                clip_name=f"Title_{scene.get('id', 'unknown')}"
            )
            
            clip.metadata['globalTimelineStart'] = timeline_start
            clip.metadata['componentType'] = 'TitleCard'
            
            clips_to_add.append({
                'start': timeline_start,
                'end': timeline_start + duration,
                'clip': clip
            })
            
        # Sort and Fill with Gaps
        clips_to_add.sort(key=lambda x: x['start'])
        current_time = 0.0
        
        for item in clips_to_add:
            gap_duration = item['start'] - current_time
            if gap_duration > 0.01: # Tolerance
                track.append(otio.schema.Gap(duration=otio.opentime.from_seconds(gap_duration)))
                current_time += gap_duration
            
            # If overlap (start < current), we might have issue. 
            # Ideally shouldn't happen for Insert. For Overlay, might overlap.
            # If overlap, we just append (OTIO sequence pushes it). 
            # But correct gap filling assumes no overlap.
            # To fix overlap, we'd need multiple tracks or adjust time. 
            # For now, assume sequential is mostly fine or user accepts push.
            
            track.append(item['clip'])
            current_time += item['end'] - item['start'] # Add actual clip duration
            
        return track

    def _create_caption_track(
        self,
        script: Dict,
        transcript: Dict,
        video_logic_map: Dict,
        segments: List[Dict]
    ) -> otio.schema.Track:
        track = self.create_video_track(name="Captions")
        
        # Look for style in subtitle (preferred) or transcript
        subtitle_config = script.get('subtitle', {})
        style = subtitle_config.get('style') or transcript.get('style', 'highlight-word')
        
        timestamps = transcript.get('timestamps', [])
        
        # Flatten all words with Global Logical Time
        all_words = []
        for ts in timestamps:
            vid_id = ts.get('sourceVideoId')
            if vid_id and vid_id in video_logic_map:
                base_start = video_logic_map[vid_id]['start']
                all_words.append({
                    'word': ts.get('word', ''),
                    'logic_start': base_start + ts.get('start', 0),
                    'logic_end': base_start + ts.get('end', 0)
                })
        
        # We process segments. 
        # For each 'video' segment, we create a Caption Clip containing words that overlap with it.
        # This ensures captions pause when video pauses (gap).
        
        for seg in segments:
            if seg['type'] == 'gap':
                # Insert gap in caption track too
                track.append(otio.schema.Gap(duration=otio.opentime.from_seconds(seg['duration'])))
            
            elif seg['type'] == 'video':
                seg_start = seg['logic_start']
                seg_end = seg['logic_end']
                seg_duration = seg['duration']
                
                # Filter words in this range
                segment_words = []
                for w in all_words:
                    # Check overlap or inclusion
                    # We care about words starting in this segment
                    if w['logic_start'] >= seg_start and w['logic_start'] < seg_end:
                        # Relativize time to clip start (0.0)
                        segment_words.append({
                            'word': w['word'],
                            'start': w['logic_start'] - seg_start,
                            'end': w['logic_end'] - seg_start
                        })
                
                # Only create clip if we have words? 
                # Ideally yes, but to maintain track sync with gaps, we should create a clip (maybe empty?) 
                # or a Gap if empty. But simpler to create a Clip without words if needed, 
                # but 'TikTokCaption' might crash with empty words.
                
                if not segment_words:
                    track.append(otio.schema.Gap(duration=otio.opentime.from_seconds(seg_duration)))
                else:
                    clip = self.create_component_clip(
                        component_name='TikTokCaption',
                        duration_sec=seg_duration,
                        props={
                            'words': segment_words,
                            'style': style
                        },
                        clip_name=f"Captions_Seg_{seg_start:.1f}"
                    )
                    clip.metadata['componentType'] = 'CaptionGroup'
                    track.append(clip)
                    
        return track

    def _create_music_track(self, resources, script, total_duration) -> Optional[otio.schema.Track]:
        music_config = script.get('music', {})
        if not music_config.get('enabled', True):
            return None
            
        fade_in = music_config.get('fadeIn', 2.0)
        fade_out = music_config.get('fadeOut', 2.0)
        
        music_clip = self.create_music_clip(
            resources=resources,
            duration_sec=total_duration,
            fade_in_sec=fade_in
        )
        
        if not music_clip:
            return None
            
        music_clip.metadata['audio_fade_out'] = str(fade_out)
        music_clip.metadata['volume'] = music_config.get('volume', 0.08)
        music_clip.metadata['componentType'] = 'BackgroundMusic'
        
        track = self.create_audio_track(name="Background Music")
        track.append(music_clip)
        return track
        
    def _create_broll_track(
        self,
        scenes: List[Dict],
        video_logic_map: Dict,
        resources: Dict,
        shift_map: List[Dict]
    ) -> otio.schema.Track:
        track = self.create_video_track(name="B-roll")
        clips_to_add = []
        
        for scene in scenes:
            broll_suggestions = scene.get('brollSuggestions', [])
            if not broll_suggestions:
                continue
            
            vid_id = scene.get('sourceVideoId')
            if not vid_id or vid_id not in video_logic_map:
                continue
                
            logic_start_base = video_logic_map[vid_id]['start'] + scene.get('sourceVideoStartTime', 0)
            
            for broll in broll_suggestions:
                broll_url = self._resolve_broll_resource(broll, resources, scene.get('id'))
                if not broll_url:
                    continue
                
                logic_start = logic_start_base + broll.get('startTime', 0)
                timeline_start = self._map_logic_to_timeline(logic_start, shift_map)
                
                duration = broll.get('duration', 3.0)
                clip = self.create_clip_from_url(
                    url=broll_url,
                    name=broll.get('id', 'broll'),
                    duration_sec=duration,
                    metadata={
                        'componentType': 'BRoll',
                        'mode': broll.get('mode', 'smart'),
                        'smartRules': broll.get('smartRules', {}),
                        'globalTimelineStart': timeline_start
                    }
                )
                
                clips_to_add.append({
                    'start': timeline_start,
                    'end': timeline_start + duration,
                    'clip': clip
                })
        
        # Sort and Fill with Gaps
        clips_to_add.sort(key=lambda x: x['start'])
        current_time = 0.0
        
        for item in clips_to_add:
            gap_duration = item['start'] - current_time
            if gap_duration > 0.01:
                track.append(otio.schema.Gap(duration=otio.opentime.from_seconds(gap_duration)))
                current_time += gap_duration
                
            track.append(item['clip'])
            current_time += item['end'] - item['start']
            
        return track

    def _resolve_broll_resource(self, broll, resources, scene_id):
        if not self.asset_resolver: return None
        trigger = broll.get('triggerText', '').lower()
        
        # Search videos
        for v in resources.get('resources', {}).get('videos', []):
            if v.get('sceneId') == scene_id or trigger in v.get('sceneId', '').lower():
                 if v.get('results'):
                     urls = v['results'][0].get('downloadUrls', {})
                     return urls.get('hd') or urls.get('sd')
                     
        # Search images
        for i in resources.get('resources', {}).get('images', []):
             if i.get('sceneId') == scene_id or trigger in i.get('sceneId', '').lower():
                 if i.get('results'):
                     return i['results'][0].get('downloadUrl')
                     
        return None
