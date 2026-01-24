import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import { noise3D } from '@remotion/noise';

interface Node {
    id: number;
    x: number;
    y: number;
    appearFrame: number;
    connections: number[];
    level: number; // Distance from center (0 = center, 1 = first ring, etc.)
}

export const NetworkVisualization: React.FC = () => {
    const frame = useCurrentFrame();
    const fps = 30;

    // Generate network nodes in an organic pattern
    const generateNodes = (): Node[] => {
        const nodes: Node[] = [];
        const centerX = 50; // percentage
        const centerY = 50; // percentage

        // Center node
        nodes.push({
            id: 0,
            x: centerX,
            y: centerY,
            appearFrame: 0,
            connections: [1, 2, 3],
            level: 0,
        });

        // First ring - 3 nodes
        const firstRingAngles = [0, 120, 240];
        firstRingAngles.forEach((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const distance = 20;
            nodes.push({
                id: i + 1,
                x: centerX + Math.cos(rad) * distance,
                y: centerY + Math.sin(rad) * distance,
                appearFrame: 30 + i * 15,
                connections: i === 0 ? [4, 5] : i === 1 ? [6, 7] : [8, 9],
                level: 1,
            });
        });

        // Second ring - 6 nodes
        const secondRingAngles = [30, 90, 150, 210, 270, 330];
        secondRingAngles.forEach((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const distance = 35;
            nodes.push({
                id: i + 4,
                x: centerX + Math.cos(rad) * distance,
                y: centerY + Math.sin(rad) * distance,
                appearFrame: 75 + i * 12,
                connections: i < 3 ? [10 + i] : [],
                level: 2,
            });
        });

        // Third ring - 3 outer nodes
        const thirdRingAngles = [60, 180, 300];
        thirdRingAngles.forEach((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const distance = 45;
            nodes.push({
                id: i + 10,
                x: centerX + Math.cos(rad) * distance,
                y: centerY + Math.sin(rad) * distance,
                appearFrame: 147 + i * 10,
                connections: [],
                level: 3,
            });
        });

        return nodes;
    };

    const nodes = generateNodes();

    // Background particles
    const renderBackgroundParticles = () => {
        return [...Array(60)].map((_, i) => {
            const x = (i * 17 + 13) % 100;
            const y = (i * 23 + 7) % 100;
            const speed = 0.02 + (i % 5) * 0.01;
            const noiseFactor = noise3D('particle', i * 0.1, frame * speed, 0);

            const offsetX = noiseFactor * 3;
            const offsetY = noise3D('particle-y', i * 0.1, frame * speed, 1) * 3;

            const opacity = interpolate(
                Math.sin(frame * 0.05 + i),
                [-1, 1],
                [0.1, 0.4],
                {
                    extrapolateLeft: 'clamp',
                    extrapolateRight: 'clamp',
                }
            );

            const size = 1 + (i % 3);

            return (
                <div
                    key={`particle-${i}`}
                    style={{
                        position: 'absolute',
                        left: `${x + offsetX}%`,
                        top: `${y + offsetY}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: '50%',
                        background: '#4a9eff',
                        opacity,
                        boxShadow: `0 0 ${size * 2}px #4a9eff`,
                    }}
                />
            );
        });
    };

    // Render a single node
    const renderNode = (node: Node) => {
        const nodeProgress = interpolate(
            frame,
            [node.appearFrame, node.appearFrame + 20],
            [0, 1],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.back(1.5)),
            }
        );

        if (nodeProgress === 0) return null;

        // Pulse effect
        const pulseScale = interpolate(
            Math.sin(frame * 0.1 + node.id),
            [-1, 1],
            [0.95, 1.05],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            }
        );

        // Organic movement with noise
        const noiseX = noise3D('node-x', node.id, frame * 0.02, 0) * 0.5;
        const noiseY = noise3D('node-y', node.id, frame * 0.02, 1) * 0.5;

        const scale = nodeProgress * pulseScale;
        const opacity = nodeProgress;

        // Node size based on level (center is bigger)
        const baseSize = node.level === 0 ? 24 : node.level === 1 ? 18 : node.level === 2 ? 14 : 12;
        const size = baseSize * scale;

        // Glow intensity
        const glowIntensity = interpolate(
            Math.sin(frame * 0.08 + node.id * 0.5),
            [-1, 1],
            [1, 1.8],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            }
        );

        return (
            <div
                key={`node-${node.id}`}
                style={{
                    position: 'absolute',
                    left: `${node.x + noiseX}%`,
                    top: `${node.y + noiseY}%`,
                    transform: 'translate(-50%, -50%)',
                    opacity,
                }}
            >
                {/* Outer glow */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: `${size * 2}px`,
                        height: `${size * 2}px`,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, rgba(74, 158, 255, 0.4) 0%, transparent 70%)`,
                        opacity: glowIntensity * 0.6,
                    }}
                />

                {/* Main node */}
                <div
                    style={{
                        position: 'relative',
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: '50%',
                        background: node.level === 0
                            ? 'radial-gradient(circle, #ffffff 0%, #4a9eff 100%)'
                            : 'radial-gradient(circle, #e0f2ff 0%, #4a9eff 100%)',
                        boxShadow: `
              0 0 ${10 * glowIntensity}px rgba(74, 158, 255, 0.8),
              0 0 ${20 * glowIntensity}px rgba(74, 158, 255, 0.6),
              inset 0 0 ${8}px rgba(255, 255, 255, 0.5)
            `,
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                    }}
                />

                {/* Pulse ring */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: `${size * 1.5}px`,
                        height: `${size * 1.5}px`,
                        borderRadius: '50%',
                        border: '1px solid rgba(74, 158, 255, 0.4)',
                        opacity: interpolate(
                            Math.sin(frame * 0.15 + node.id),
                            [-1, 1],
                            [0.2, 0.6],
                            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                        ),
                    }}
                />
            </div>
        );
    };

    // Render connection line between two nodes
    const renderConnection = (fromNode: Node, toNode: Node) => {
        // Connection appears after both nodes are visible
        const startFrame = Math.max(fromNode.appearFrame + 10, toNode.appearFrame);

        const connectionProgress = interpolate(
            frame,
            [startFrame, startFrame + 15],
            [0, 1],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
            }
        );

        if (connectionProgress === 0) return null;

        // Add noise to node positions for organic movement
        const fromNoiseX = noise3D('node-x', fromNode.id, frame * 0.02, 0) * 0.5;
        const fromNoiseY = noise3D('node-y', fromNode.id, frame * 0.02, 1) * 0.5;
        const toNoiseX = noise3D('node-x', toNode.id, frame * 0.02, 0) * 0.5;
        const toNoiseY = noise3D('node-y', toNode.id, frame * 0.02, 1) * 0.5;

        const x1 = fromNode.x + fromNoiseX;
        const y1 = fromNode.y + fromNoiseY;
        const x2 = toNode.x + toNoiseX;
        const y2 = toNode.y + toNoiseY;

        // Calculate line properties
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

        // Animated glow
        const glowIntensity = interpolate(
            Math.sin(frame * 0.1 + fromNode.id + toNode.id),
            [-1, 1],
            [0.4, 0.8],
            {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
            }
        );

        // Flowing energy effect
        const flowOffset = (frame * 2) % 20;

        return (
            <div
                key={`connection-${fromNode.id}-${toNode.id}`}
                style={{
                    position: 'absolute',
                    left: `${x1}%`,
                    top: `${y1}%`,
                    width: `${length}%`,
                    height: '2px',
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 50%',
                    opacity: connectionProgress,
                }}
            >
                {/* Glow layer */}
                <div
                    style={{
                        position: 'absolute',
                        width: `${connectionProgress * 100}%`,
                        height: '6px',
                        top: '-2px',
                        background: `linear-gradient(90deg, 
              rgba(74, 158, 255, 0) 0%, 
              rgba(74, 158, 255, ${glowIntensity * 0.6}) 50%, 
              rgba(74, 158, 255, 0) 100%
            )`,
                        filter: 'blur(3px)',
                    }}
                />

                {/* Main line */}
                <div
                    style={{
                        position: 'absolute',
                        width: `${connectionProgress * 100}%`,
                        height: '2px',
                        background: `linear-gradient(90deg, 
              rgba(74, 158, 255, 0.3) 0%, 
              rgba(255, 255, 255, 0.8) 50%, 
              rgba(74, 158, 255, 0.3) 100%
            )`,
                        boxShadow: `0 0 8px rgba(74, 158, 255, ${glowIntensity})`,
                    }}
                />

                {/* Flowing energy particles */}
                {[...Array(3)].map((_, i) => {
                    const particlePos = ((flowOffset + i * 7) % 20) / 20 * 100;

                    return (
                        <div
                            key={`flow-${i}`}
                            style={{
                                position: 'absolute',
                                left: `${particlePos * connectionProgress}%`,
                                top: '-1px',
                                width: '4px',
                                height: '4px',
                                borderRadius: '50%',
                                background: '#ffffff',
                                boxShadow: '0 0 6px #4a9eff',
                                opacity: connectionProgress,
                            }}
                        />
                    );
                })}
            </div>
        );
    };

    return (
        <AbsoluteFill
            style={{
                background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 50%, #0f1b2e 100%)',
                overflow: 'hidden',
            }}
        >
            {/* Background particles */}
            <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                {renderBackgroundParticles()}
            </div>

            {/* Connection lines */}
            <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                {nodes.map((node) =>
                    node.connections.map((connectedId) => {
                        const connectedNode = nodes.find((n) => n.id === connectedId);
                        if (!connectedNode) return null;
                        return renderConnection(node, connectedNode);
                    })
                )}
            </div>

            {/* Nodes */}
            <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                {nodes.map((node) => renderNode(node))}
            </div>

            {/* Title overlay (optional) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    opacity: interpolate(
                        frame,
                        [180, 210],
                        [0, 1],
                        {
                            extrapolateLeft: 'clamp',
                            extrapolateRight: 'clamp',
                        }
                    ),
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        fontSize: '48px',
                        fontWeight: 700,
                        fontFamily: "'Inter', sans-serif",
                        color: '#ffffff',
                        textAlign: 'center',
                        textShadow: `
              0 0 20px rgba(74, 158, 255, 0.8),
              0 0 40px rgba(74, 158, 255, 0.4)
            `,
                        letterSpacing: '0.05em',
                    }}
                >
                    NETWORK
                </h2>
            </div>
        </AbsoluteFill>
    );
};
