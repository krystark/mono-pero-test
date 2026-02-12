import React from 'react';
import IconWrap from '../../../ui/IconWrap';
import { IconProps } from '../../../types';

const EyeOffIcon: React.FC<IconProps> = ({ ...rest }) => (
    <IconWrap viewBox="0 0 20 20" {...rest}>
        <path d="M3 5l18 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path
            d="M10.6 6.3A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3.1 3.9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
        <path
            d="M6.6 8.2C3.7 10.6 2.5 12 2.5 12s3.5 7 9.5 7c1.3 0 2.5-.2 3.6-.6"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
        <path
            d="M9.9 9.7A3 3 0 0 0 12 15c.4 0 .8-.1 1.1-.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
        />
    </IconWrap>
);

export default EyeOffIcon;
