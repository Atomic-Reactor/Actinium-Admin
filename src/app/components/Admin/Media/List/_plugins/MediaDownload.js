import Reactium from 'reactium-core/sdk';
import React, { useCallback } from 'react';
import ENUMS from 'components/Admin/Media/enums';
import { Button, Icon } from '@atomic-reactor/reactium-ui';

const MediaDownload = props => {
    const onClick = useCallback(e =>
        Reactium.Media.download({ ...props, ...props.file }),
    );

    return (
        <Button
            color={Button.ENUMS.COLOR.DEFAULT}
            data-align='left'
            data-tooltip={ENUMS.TEXT.DOWNLOAD_FILE}
            data-vertical-align='middle'
            onClick={() => onClick()}
            type={Button.ENUMS.TYPE.BUTTON}>
            <Icon name='Feather.DownloadCloud' />
        </Button>
    );
};

export { MediaDownload, MediaDownload as default };
