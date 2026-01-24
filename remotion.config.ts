import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setExperimentalClientSideRenderingEnabled(true);

Config.overrideWebpackConfig((currentConfiguration) => {
    return {
        ...currentConfiguration,
        module: {
            ...currentConfiguration.module,
            rules: [
                ...(currentConfiguration.module?.rules ?? []),
                {
                    test: /\.otio$/,
                    type: 'json',
                },
            ],
        },
    };
});