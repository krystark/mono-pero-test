import React from 'react';
import IconWrap from '../../../ui/IconWrap';
import { IconProps } from '../../../types';

const LockIcon: React.FC<IconProps> = ({ ...rest }) => (
    <IconWrap viewBox="0 0 20 20" {...rest}>
        <path
            d="M1 9.5L3.5 7L3.5 4L4.5 3L4.5 2L6 0.5L7.5 0ZM11.5 0L13 0.5L14.5 2L14.5 3L15.5 4L15.5 7L18 9.5ZM13.5 7L13.5 4L11 1.5L8 1.5L5.5 4L5.5 7L6 7.5L13 7.5L13.5 7ZM15.5 17L16.5 16L16.5 11L15 9.5L4 9.5L2.5 11L2.5 16L4 17.5L15.5 17Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
        />
    </IconWrap>
);

export default LockIcon;
