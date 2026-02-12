import React from 'react';
import IconWrap from '../../../ui/IconWrap';
import { IconProps } from '../../../types';

const EyeOffIcon: React.FC<IconProps> = ({ ...rest }) => (
    <IconWrap viewBox="0 0 20 20" {...rest}>
        <path
            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
        />
        <path d="M12 15a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" stroke="currentColor" strokeWidth="1.6" />
    </IconWrap>
);

export default EyeOffIcon;
