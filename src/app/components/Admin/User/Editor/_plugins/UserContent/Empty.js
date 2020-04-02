import _ from 'underscore';
import op from 'object-path';
import React, { useState } from 'react';
import Reactium, { __, useAsyncEffect } from 'reactium-core/sdk';
import { Button, Dropdown, Icon, Spinner } from '@atomic-reactor/reactium-ui';

export default ({ className = 'media-empty', value = {} }) => {
    const name = op.get(value, 'fname', op.get(value, 'username'));
    const isMe = Reactium.User.isCurrent(value);

    const [types, setTypes] = useState();

    const getTypes = refresh => Reactium.ContentType.types({ refresh });

    let msg = isMe
        ? __("Hey %name, looks like you haven't created any content yet!")
        : __("%name hasn't created any content yet!");

    msg = msg.replace(/\%name/gi, name);

    const onItemSelect = ({ item }) =>
        Reactium.Routing.history.push(op.get(item, 'value'));

    useAsyncEffect(async mounted => {
        if (!types) {
            const response = await getTypes();
            if (mounted()) {
                setTypes(
                    _.compact(
                        response.map(item => {
                            const { icon, label } = op.get(item, 'meta');

                            if (!icon || !label) return null;

                            const type = op.get(item, 'type');
                            const value = `/admin/content/${type}/new`;

                            return { icon, label, value };
                        }),
                    ),
                );
            }
        }
        return () => {};
    });

    return !types || _.isEmpty(value) ? (
        <div className={className}>
            <Spinner />
        </div>
    ) : (
        <div className={className}>
            <h2 className='text-center'>{msg}</h2>
            <div className='py-xs-32 text-center'>
                {types && isMe && (
                    <Dropdown
                        color={Button.ENUMS.COLOR.CLEAR}
                        data={types}
                        onItemClick={onItemSelect}
                        size={Button.ENUMS.SIZE.MD}>
                        <Button
                            appearance={Button.ENUMS.APPEARANCE.PILL}
                            data-dropdown-element
                            size={Button.ENUMS.SIZE.MD}
                            type='button'>
                            {__('Create Content')}
                        </Button>
                    </Dropdown>
                )}
            </div>
            <Svg />
        </div>
    );
};

const Svg = ({ color = '#4F82BA', width = '100%', ...props }) => (
    <svg viewBox='0 0 918.14 765.54' {...props}>
        <defs>
            <linearGradient
                id='27aa7b70-b106-4a00-be67-693c8380e41d'
                x1='397.74'
                y1='717.25'
                x2='397.74'
                y2='86.11'
                gradientUnits='userSpaceOnUse'>
                <stop offset='0' stopColor='gray' stopOpacity='0.25' />
                <stop offset='0.54' stopColor='gray' stopOpacity='0.12' />
                <stop offset='1' stopColor='gray' stopOpacity='0.1' />
            </linearGradient>
            <linearGradient
                id='46a816da-c484-41ec-8a6f-fbf14454d910'
                x1='288.88'
                y1='378.44'
                x2='288.88'
                y2='209.65'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
            <linearGradient
                id='32b634d8-28f1-48d9-a868-f602a2cad942'
                x1='288.88'
                y1='328.29'
                x2='288.88'
                y2='223.1'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
            <clipPath
                id='7a4c6aff-0be0-461b-a111-b3ae1b8fbf73'
                transform='translate(-140.93 -67.23)'>
                <rect
                    id='8cc91f6d-19b0-43cc-9c18-2faa83ac34ba'
                    data-name='&lt;Rectangle&gt;'
                    x='354.51'
                    y='291.55'
                    width='150.6'
                    height='101.52'
                    fill='#fff'
                />
            </clipPath>
            <linearGradient
                id='38f1cb81-8fac-4205-a0ff-a33ac00d354c'
                x1='288.88'
                y1='594.94'
                x2='288.88'
                y2='426.14'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
            <linearGradient
                id='6fc01aaf-135e-403e-a209-43b2a4fe59f1'
                x1='288.88'
                y1='544.79'
                x2='288.88'
                y2='439.6'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
            <clipPath
                id='79ce363a-d134-40e4-9f82-b96d04a36978'
                transform='translate(-140.93 -67.23)'>
                <rect
                    id='5b44e697-61fe-43bd-9a58-5f3e41301748'
                    data-name='&lt;Rectangle&gt;'
                    x='354.51'
                    y='508.05'
                    width='150.6'
                    height='101.52'
                    fill='#fff'
                />
            </clipPath>
            <linearGradient
                id='54803c44-522d-4b9e-9a34-f1f7b43e8483'
                x1='671.57'
                y1='760.34'
                x2='671.57'
                y2='129.2'
                gradientTransform='translate(1109.43 -194.1) rotate(90)'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
            <linearGradient
                id='089a6a47-adaa-499b-aefb-cd6464b62fb8'
                x1='670.96'
                y1='553.63'
                x2='670.96'
                y2='387.28'
                gradientTransform='translate(1129.51 -168.41) rotate(90)'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
            <linearGradient
                id='fd8d88e0-7826-450d-9e0b-001d1be709c2'
                x1='637.66'
                y1='754.12'
                x2='637.66'
                y2='601.05'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
            <linearGradient
                id='8d1793c5-b76e-44e2-a52e-569460402331'
                x1='778.37'
                y1='673.86'
                x2='778.37'
                y2='569.13'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
            <linearGradient
                id='4745700d-8097-45ff-9f71-625443fc4ad8'
                x1='778.37'
                y1='774.41'
                x2='778.37'
                y2='713.66'
                xlinkHref='#27aa7b70-b106-4a00-be67-693c8380e41d'
            />
        </defs>
        <g opacity='0.5'>
            <rect
                x='162.9'
                y='86.11'
                width='469.69'
                height='631.14'
                fill='url(#27aa7b70-b106-4a00-be67-693c8380e41d)'
            />
        </g>
        <rect
            x='169.02'
            y='94.67'
            width='455.01'
            height='609.12'
            fill='#f2f2f2'
        />
        <rect
            x='204.49'
            y='120.36'
            width='156.56'
            height='4.89'
            fill='#e0e0e0'
        />
        <rect
            x='204.49'
            y='142.37'
            width='156.56'
            height='4.89'
            fill={color}
            opacity='0.7'
        />
        <rect
            x='384.29'
            y='120.36'
            width='156.56'
            height='4.89'
            fill='#e0e0e0'
        />
        <rect
            x='408.75'
            y='259.8'
            width='156.56'
            height='4.89'
            fill='#e0e0e0'
        />
        <rect
            x='412.42'
            y='273.25'
            width='156.56'
            height='4.89'
            fill='#e0e0e0'
        />
        <rect
            x='419.76'
            y='286.7'
            width='156.56'
            height='4.89'
            fill='#e0e0e0'
        />
        <rect
            x='408.75'
            y='476.29'
            width='156.56'
            height='4.89'
            fill='#e0e0e0'
        />
        <rect
            x='412.42'
            y='489.75'
            width='156.56'
            height='4.89'
            fill='#e0e0e0'
        />
        <rect
            x='419.76'
            y='503.2'
            width='156.56'
            height='4.89'
            fill='#e0e0e0'
        />
        <g opacity='0.5'>
            <rect
                x='205.71'
                y='209.65'
                width='166.35'
                height='168.79'
                fill='url(#46a816da-c484-41ec-8a6f-fbf14454d910)'
            />
        </g>
        <rect
            x='206.76'
            y='213.32'
            width='163.72'
            height='161.45'
            fill='#f5f5f5'
        />
        <g opacity='0.5'>
            <rect
                x='212.53'
                y='223.1'
                width='152.7'
                height='105.19'
                fill='url(#32b634d8-28f1-48d9-a868-f602a2cad942)'
            />
        </g>
        <rect
            id='689f37f3-cc41-448d-b172-63ec123bc985'
            data-name='&lt;Rectangle&gt;'
            x='213.58'
            y='224.32'
            width='150.6'
            height='101.52'
            fill='#fff'
        />
        <g clipPath='url(#7a4c6aff-0be0-461b-a111-b3ae1b8fbf73)'>
            <polygon
                points='200.82 322.18 238.74 263.46 254.64 289.15 288.88 253.68 318.24 289.15 343.93 236.56 409.98 341.75 195.93 334.41 200.82 322.18'
                fill={color}
                opacity='0.4'
            />
            <circle cx='230.17' cy='239' r='11.01' fill={color} opacity='0.4' />
        </g>
        <g opacity='0.5'>
            <rect
                x='205.71'
                y='426.14'
                width='166.35'
                height='168.79'
                fill='url(#38f1cb81-8fac-4205-a0ff-a33ac00d354c)'
            />
        </g>
        <rect
            x='206.76'
            y='429.81'
            width='163.72'
            height='161.45'
            fill='#f5f5f5'
        />
        <g opacity='0.5'>
            <rect
                x='212.53'
                y='439.6'
                width='152.7'
                height='105.19'
                fill='url(#6fc01aaf-135e-403e-a209-43b2a4fe59f1)'
            />
        </g>
        <rect
            id='b429ac3a-f8a8-4171-bcce-5b6c002c0714'
            data-name='&lt;Rectangle&gt;'
            x='213.58'
            y='440.82'
            width='150.6'
            height='101.52'
            fill='#fff'
        />
        <g clipPath='url(#79ce363a-d134-40e4-9f82-b96d04a36978)'>
            <polygon
                points='200.82 538.67 238.74 479.96 254.64 505.65 288.88 470.18 318.24 505.65 343.93 453.05 409.98 558.24 195.93 550.9 200.82 538.67'
                fill='#bdbdbd'
                opacity='0.4'
            />
            <circle
                cx='230.17'
                cy='455.5'
                r='11.01'
                fill='#bdbdbd'
                opacity='0.4'
            />
        </g>
        <g opacity='0.5'>
            <rect
                x='349.09'
                y='242.63'
                width='631.14'
                height='469.69'
                transform='translate(-74.16 969.06) rotate(-78.76)'
                fill='url(#54803c44-522d-4b9e-9a34-f1f7b43e8483)'
            />
        </g>
        <rect
            x='359.37'
            y='247.33'
            width='609.12'
            height='455.01'
            transform='translate(-72.16 966.22) rotate(-78.76)'
            fill='#fff'
        />
        <rect
            x='523.5'
            y='197.22'
            width='322.91'
            height='4.89'
            transform='translate(-88.86 -196.94) rotate(11.24)'
            fill='#e0e0e0'
        />
        <rect
            x='433.36'
            y='650.7'
            width='322.91'
            height='4.89'
            transform='translate(-2.18 -170.66) rotate(11.24)'
            fill='#e0e0e0'
        />
        <rect
            x='428.58'
            y='671.14'
            width='249.52'
            height='4.89'
            transform='translate(1.01 -162.18) rotate(11.24)'
            fill='#e0e0e0'
        />
        <rect
            x='424.6'
            y='683.47'
            width='92.96'
            height='4.89'
            transform='translate(1.84 -145.91) rotate(11.24)'
            fill={color}
            opacity='0.7'
        />
        <rect
            x='519.57'
            y='209.08'
            width='161.45'
            height='4.89'
            transform='translate(-88.17 -180.2) rotate(11.24)'
            fill={color}
            opacity='0.7'
        />
        <rect
            x='512.84'
            y='249.31'
            width='291.11'
            height='4.89'
            transform='translate(-79.21 -190.76) rotate(11.24)'
            fill='#e0e0e0'
        />
        <rect
            x='509.47'
            y='255.44'
            width='70.94'
            height='4.89'
            transform='translate(-80.19 -168.52) rotate(11.24)'
            fill='#3ad29f'
            opacity='0.7'
        />
        <rect
            x='501.56'
            y='307.59'
            width='322.91'
            height='4.89'
            transform='translate(-67.76 -190.54) rotate(11.24)'
            fill='#e0e0e0'
        />
        <g opacity='0.5'>
            <rect
                x='575.87'
                y='357.6'
                width='166.35'
                height='289.88'
                transform='translate(-103.27 983.74) rotate(-78.76)'
                fill='url(#089a6a47-adaa-499b-aefb-cd6464b62fb8)'
            />
        </g>
        <rect
            x='516.06'
            y='420.61'
            width='286.22'
            height='162.68'
            transform='translate(-30.42 -186.11) rotate(11.24)'
            fill='#fff'
        />
        <rect
            x='496.08'
            y='335.18'
            width='322.91'
            height='4.89'
            transform='translate(-62.49 -188.94) rotate(11.24)'
            fill='#e0e0e0'
        />
        <rect
            x='547.86'
            y='424.02'
            width='35.47'
            height='118.64'
            transform='translate(-35.84 -168.22) rotate(11.24)'
            fill={color}
        />
        <rect
            x='606.43'
            y='475.19'
            width='35.47'
            height='79.5'
            transform='translate(-28.56 -179.03) rotate(11.24)'
            fill='#3ad29f'
        />
        <rect
            x='665.23'
            y='523.93'
            width='35.47'
            height='42.81'
            transform='translate(-21.5 -189.92) rotate(11.24)'
            fill='#f55f44'
        />
        <rect
            x='731.91'
            y='492.72'
            width='35.47'
            height='86.84'
            transform='translate(-22.02 -203.09) rotate(11.24)'
            fill='#fdd835'
        />
        <g opacity='0.5'>
            <rect
                x='128.65'
                y='645.09'
                width='3.67'
                height='20.79'
                fill='#47e6b1'
            />
            <rect
                x='269.58'
                y='712.31'
                width='3.67'
                height='20.79'
                transform='translate(853.2 384.07) rotate(90)'
                fill='#47e6b1'
            />
        </g>
        <path
            d='M699.44,75.56a4.49,4.49,0,0,1-2.5-5.43,2.16,2.16,0,0,0,.1-.5h0a2.25,2.25,0,0,0-4-1.49h0a2.16,2.16,0,0,0-.25.44,4.49,4.49,0,0,1-5.43,2.5,2.16,2.16,0,0,0-.5-.1h0a2.25,2.25,0,0,0-1.49,4h0a2.16,2.16,0,0,0,.44.25,4.49,4.49,0,0,1,2.5,5.43,2.16,2.16,0,0,0-.1.5h0a2.25,2.25,0,0,0,4,1.49h0a2.16,2.16,0,0,0,.25-.44,4.49,4.49,0,0,1,5.43-2.5,2.16,2.16,0,0,0,.5.1h0a2.25,2.25,0,0,0,1.49-4h0A2.16,2.16,0,0,0,699.44,75.56Z'
            transform='translate(-140.93 -67.23)'
            fill='#4d8af0'
            opacity='0.5'
        />
        <path
            d='M286.33,179.4a4.49,4.49,0,0,1-2.5-5.43,2.16,2.16,0,0,0,.1-.5h0a2.25,2.25,0,0,0-4-1.49h0a2.16,2.16,0,0,0-.25.44,4.49,4.49,0,0,1-5.43,2.5,2.16,2.16,0,0,0-.5-.1h0a2.25,2.25,0,0,0-1.49,4h0a2.16,2.16,0,0,0,.44.25,4.49,4.49,0,0,1,2.5,5.43,2.16,2.16,0,0,0-.1.5h0a2.25,2.25,0,0,0,4,1.49h0a2.16,2.16,0,0,0,.25-.44,4.49,4.49,0,0,1,5.43-2.5,2.16,2.16,0,0,0,.5.1h0a2.25,2.25,0,0,0,1.49-4h0A2.16,2.16,0,0,0,286.33,179.4Z'
            transform='translate(-140.93 -67.23)'
            fill='#fdd835'
            opacity='0.5'
        />
        <path
            d='M253.63,484.46a4.49,4.49,0,0,1-2.5-5.43,2.16,2.16,0,0,0,.1-.5h0a2.25,2.25,0,0,0-4-1.49h0a2.16,2.16,0,0,0-.25.44,4.49,4.49,0,0,1-5.43,2.5,2.16,2.16,0,0,0-.5-.1h0a2.25,2.25,0,0,0-1.49,4h0a2.16,2.16,0,0,0,.44.25,4.49,4.49,0,0,1,2.5,5.43,2.16,2.16,0,0,0-.1.5h0a2.25,2.25,0,0,0,4,1.49h0a2.16,2.16,0,0,0,.25-.44,4.49,4.49,0,0,1,5.43-2.5,2.16,2.16,0,0,0,.5.1h0a2.25,2.25,0,0,0,1.49-4h0A2.16,2.16,0,0,0,253.63,484.46Z'
            transform='translate(-140.93 -67.23)'
            fill='#fdd835'
            opacity='0.5'
        />
        <circle cx='337.81' cy='28.62' r='7.34' fill='#f55f44' opacity='0.5' />
        <circle cx='7.34' cy='317.46' r='7.34' fill='#f55f44' opacity='0.5' />
        <circle cx='863.76' cy='120.36' r='7.34' fill='#f55f44' opacity='0.5' />
        <circle cx='822.17' cy='339.3' r='7.34' fill='#4d8af0' opacity='0.5' />
        <circle cx='37.68' cy='145.22' r='7.34' fill='#47e6b1' opacity='0.5' />
        <circle cx='853.29' cy='647.34' r='7.34' fill='#47e6b1' opacity='0.5' />
        <circle cx='910.8' cy='430.97' r='7.34' fill='#47e6b1' opacity='0.5' />
        <rect
            x='544.42'
            y='601.05'
            width='186.48'
            height='153.07'
            fill='url(#fd8d88e0-7826-450d-9e0b-001d1be709c2)'
        />
        <path
            d='M723.82,639a54.55,54.55,0,0,1,109.1,0v34.91h15.27V639a69.82,69.82,0,0,0-139.65,0v34.91h15.27Z'
            transform='translate(-140.93 -67.23)'
            fill='url(#8d1793c5-b76e-44e2-a52e-569460402331)'
        />
        <path
            d='M726,638.25a52.37,52.37,0,1,1,104.74,0v33.52H845.4V638.25a67,67,0,0,0-134.06,0v33.52H726Z'
            transform='translate(-140.93 -67.23)'
            fill='#f5f5f5'
        />
        <rect
            x='546.32'
            y='602.45'
            width='182.24'
            height='148.73'
            fill={color}
        />
        <rect
            x='546.32'
            y='602.45'
            width='182.24'
            height='148.73'
            fill='#f5f5f5'
        />
        <rect
            x='546.32'
            y='631.77'
            width='182.24'
            height='90.07'
            fill={color}
        />
        <path
            d='M791.73,727a13.36,13.36,0,1,0-23.08,9.15v28.51a9.72,9.72,0,0,0,19.44,0V736.18A13.3,13.3,0,0,0,791.73,727Z'
            transform='translate(-140.93 -67.23)'
            fill='url(#4745700d-8097-45ff-9f71-625443fc4ad8)'
        />
        <path
            d='M789.89,729.38a11.52,11.52,0,1,0-19.9,7.89v24.58a8.38,8.38,0,1,0,16.76,0V737.27A11.47,11.47,0,0,0,789.89,729.38Z'
            transform='translate(-140.93 -67.23)'
            opacity='0.2'
        />
    </svg>
);
