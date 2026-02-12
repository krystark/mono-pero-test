import React from 'react';
import IconWrap from '../../../ui/IconWrap';
import { IconProps } from '../../../types';

const UserIcon: React.FC<IconProps> = ({ ...rest }) => (
    <IconWrap viewBox="0 0 20 20" {...rest}>
        <path
            d="M10.833 9.583L7.5 9.583L5.417 6.667L5.417 4.167L6.667 2.5L9.167 1.25L10.833 1.25L13.75 4.167L13.75 6.667L12.917 8.333L10.833 9.583ZM11.25 7.5L12.083 6.667L12.083 5L9.583 2.917L8.333 2.917L7.083 5L7.083 6.667L8.333 7.917L11.25 7.5ZM15 17.917L14.167 17.083L14.167 15.417L12.083 13.333L8.333 13.333L6.25 15.417L6.25 17.083L5.417 17.917ZM4.583 17.917L4.583 15.417L6.25 13.333L14.167 13.333L15.833 15.417L15.833 17.917Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
        />
    </IconWrap>
);

export default UserIcon;
