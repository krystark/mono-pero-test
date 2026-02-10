export type Crumb = {
    id: string;
    title: string;
    url?: string;           // если нет — это текущая
    icon?: React.ReactNode; // можно передать <IconHome />
    moduleId?: string;      // id модуля из ядра, если нужно
    children?: Crumb[];     // на случай глубокой сборки
};

export type IconProps = { className?: string };
export type IconLike =
    | React.ComponentType<IconProps>
    | React.ReactElement<IconProps>
    | null
    | undefined;

export type TabItem = { id: string; title: string; url: string };

export type MenuItem = {
    id: string;
    title: string;
    url?: string;
    icon?: IconLike;
    tabs?: TabItem[];

    mobile?: boolean;
    sort?: number;
};
