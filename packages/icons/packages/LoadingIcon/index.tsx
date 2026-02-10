import React from 'react';
import IconWrap from '../../ui/IconWrap';



import { IconProps } from '../../types';
const LoadingIcon: React.FC<IconProps> = ({...rest}) => (
  <IconWrap {...rest}>
    <path d="M10 3.125C6.20304 3.125 3.125 6.20304 3.125 10C3.125 13.7969 6.20304 16.875 10 16.875C13.7969 16.875 16.875 13.7969 16.875 10C16.875 9.65483 17.1548 9.375 17.5 9.375C17.8452 9.375 18.125 9.65483 18.125 10C18.125 14.4873 14.4873 18.125 10 18.125C5.51268 18.125 1.875 14.4873 1.875 10C1.875 5.51268 5.51268 1.875 10 1.875C10.3452 1.875 10.625 2.15483 10.625 2.5C10.625 2.84517 10.3452 3.125 10 3.125Z" fill="currentColor" />
  </IconWrap>
);

export default LoadingIcon;
