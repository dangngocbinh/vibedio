import React from 'react';
import { Composition } from 'remotion';
import { z } from 'zod';


import { OtioPlayer, calculateTotalDuration } from './compositions/OtioPlayer';
import { HtmlGalleryViewer } from './compositions/HtmlGalleryViewer';

// @ts-ignore
import projectsListRaw from './generated/projects.json';
import { loadProject } from './utils/project-loader';

const projectsList = (projectsListRaw as any[]).map(p => ({
  ...p,
  ratio: p.ratio === null ? undefined : p.ratio
}));

const projectIds = projectsList.length > 0
  ? projectsList.map((p: any) => p.id)
  : ['default'];

const OtioSchema = z.object({
  projectId: z.enum(projectIds as [string, ...string[]]),
});



/**
 * Metadata calculation function for JSON-based videos
 * Fetches JSON and determines the correct duration
 */


export const RemotionRoot: React.FC = () => {
  const fps = 30;

  // Calculate OTIO duration
  // Default duration used if no metadata is calculated
  const defaultTimelineDuration = 30 * fps;

  return (
    <>
      {/* OtioTimeline - Portrait 9:16 (Default for TikTok/Shorts/Reels) */}
      <Composition
        id="Preview-Portrait"
        component={OtioPlayer}
        durationInFrames={defaultTimelineDuration}
        fps={fps}
        width={1080}
        height={1920}
        schema={OtioSchema}
        defaultProps={{
          // @ts-ignore
          projectId: projectIds[0]
        }}
        calculateMetadata={async ({ props }) => {
          if (props.projectId) {
            const project = projectsList.find((p: any) => p.id === props.projectId);
            if (project) {
              try {
                const tl = await loadProject(project);
                const dur = calculateTotalDuration(tl, fps);
                if (dur > 0) {
                  return { durationInFrames: dur };
                }
              } catch (e) {
                console.error("[OtioTimeline] Failed to calc duration", e);
              }
            }
          }
          return { durationInFrames: defaultTimelineDuration };
        }}
      />
      {/* OtioTimeline - Landscape 16:9 (YouTube) */}
      <Composition
        id="Preview-Landscape"
        component={OtioPlayer}
        durationInFrames={defaultTimelineDuration}
        fps={fps}
        width={1920}
        height={1080}
        schema={OtioSchema}
        defaultProps={{
          // @ts-ignore
          projectId: projectIds[0]
        }}
        calculateMetadata={async ({ props }) => {
          if (props.projectId) {
            const project = projectsList.find((p: any) => p.id === props.projectId);
            if (project) {
              try {
                const tl = await loadProject(project);
                const dur = calculateTotalDuration(tl, fps);
                if (dur > 0) {
                  return { durationInFrames: dur };
                }
              } catch (e) {
                console.error("[OtioTimelineLandscape] Failed to calc duration", e);
              }
            }
          }
          return { durationInFrames: defaultTimelineDuration };
        }}
      />
      {/* OtioTimeline - Square 1:1 (Instagram) */}
      <Composition
        id="Preview-Square"
        component={OtioPlayer}
        durationInFrames={defaultTimelineDuration}
        fps={fps}
        width={1080}
        height={1080}
        schema={OtioSchema}
        defaultProps={{
          // @ts-ignore
          projectId: projectIds[0]
        }}
        calculateMetadata={async ({ props }) => {
          if (props.projectId) {
            const project = projectsList.find((p: any) => p.id === props.projectId);
            if (project) {
              try {
                const tl = await loadProject(project);
                const dur = calculateTotalDuration(tl, fps);
                if (dur > 0) {
                  return { durationInFrames: dur };
                }
              } catch (e) {
                console.error("[OtioTimelineSquare] Failed to calc duration", e);
              }
            }
          }
          return { durationInFrames: defaultTimelineDuration };
        }}
      />
      {/* OtioTimeline - Portrait 4:5 (Instagram/Facebook Feed) */}
      <Composition
        id="Preview-4x5"
        component={OtioPlayer}
        durationInFrames={defaultTimelineDuration}
        fps={fps}
        width={1080}
        height={1350}
        schema={OtioSchema}
        defaultProps={{
          // @ts-ignore
          projectId: projectIds[0]
        }}
        calculateMetadata={async ({ props }) => {
          if (props.projectId) {
            const project = projectsList.find((p: any) => p.id === props.projectId);
            if (project) {
              try {
                const tl = await loadProject(project);
                const dur = calculateTotalDuration(tl, fps);
                if (dur > 0) {
                  return { durationInFrames: dur };
                }
              } catch (e) {
                console.error("[OtioTimeline4x5] Failed to calc duration", e);
              }
            }
          }
          return { durationInFrames: defaultTimelineDuration };
        }}
      />


      {/* Gallery Previews (Direct Render) */}
      <Composition
        id="Lower-Third-Gallery"
        component={HtmlGalleryViewer as any}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          htmlFile: 'docs/lower-third-gallery.html',
          title: 'Lower Third Gallery'
        }}
      />

      <Composition
        id="Call-To-Action-Gallery"
        component={HtmlGalleryViewer as any}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          htmlFile: 'docs/call-to-action-gallery.html',
          title: 'Call To Action Gallery'
        }}
      />

      <Composition
        id="Fullscreen-Title-Gallery"
        component={HtmlGalleryViewer as any}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          htmlFile: 'docs/fullscreen-title-gallery.html',
          title: 'Fullscreen Title Gallery'
        }}
      />

      <Composition
        id="Sticker-Gallery"
        component={HtmlGalleryViewer as any}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          htmlFile: 'docs/sticker-gallery.html',
          title: 'Sticker Gallery'
        }}
      />

      <Composition
        id="Layer-Effect-Gallery"
        component={HtmlGalleryViewer as any}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          htmlFile: 'docs/layer-effect-gallery.html',
          title: 'Layer Effect Gallery'
        }}
      />

      <Composition
        id="SFX-Gallery"
        component={HtmlGalleryViewer as any}
        durationInFrames={1}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          htmlFile: 'docs/sfx-gallery.html',
          title: 'SFX Audio Gallery'
        }}
      />
    </>
  );
};
