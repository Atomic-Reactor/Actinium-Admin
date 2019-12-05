import React from 'react';
import ENUMS from '../enums';
import domain from '../domain';
import { useHandle } from 'reactium-core/sdk';
import { Button, Icon } from '@atomic-reactor/reactium-ui';
import { Plugins } from 'reactium-core/components/Plugable';

/**
 * -----------------------------------------------------------------------------
 * Functional Component: Toolbar
 * -----------------------------------------------------------------------------
 */
const Toolbar = ({ directory }) => {
    const Media = useHandle(domain.name);

    return Media.isEmpty() ? null : (
        <div className={Media.cname('toolbar')}>
            <div className='flex middle flex-grow'>
                <div className='mr-xs-20'>
                    <Button
                        color='clear'
                        className={Media.cname('toolbar-browse')}
                        data-tooltip={ENUMS.TEXT.BROWSE}
                        data-align='right'
                        data-vertical-align='middle'
                        onClick={e => Media.browseFiles(e)}>
                        <Icon name='Linear.FileAdd' size={40} />
                    </Button>
                </div>
                <div className='flex-grow show-md hide-xs'>
                    <h2>{ENUMS.TEXT.TOOLBAR}</h2>
                </div>
            </div>
            <div>
                <Plugins zone='admin-media-toolbar' />
            </div>
        </div>
    );
};

export default Toolbar;
