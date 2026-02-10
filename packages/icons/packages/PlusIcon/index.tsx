import React from 'react';
import IconWrap from '../../ui/IconWrap';



import { IconProps } from '../../types';
const PlusIcon: React.FC<IconProps> = ({...rest}) => (
  <IconWrap {...rest}>
    <path d="M10 1.875C10.3452 1.875 10.625 2.15483 10.625 2.5V9.375H17.5C17.8452 9.375 18.125 9.65483 18.125 10C18.125 10.3452 17.8452 10.625 17.5 10.625H10.625V17.5C10.625 17.8452 10.3452 18.125 10 18.125C9.65483 18.125 9.375 17.8452 9.375 17.5V10.625H2.5C2.15483 10.625 1.875 10.3452 1.875 10C1.875 9.65483 2.15483 9.375 2.5 9.375H9.375V2.5C9.375 2.15483 9.65483 1.875 10 1.875Z" fill="currentColor" />
  </IconWrap>
);

export default PlusIcon;
