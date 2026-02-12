export interface User {
    id: number;

    /** Контактные данные */
    email?: string;
    phone?: string;

    /** ФИО */
    name?: string;         // display / first name
    second_name?: string;  // отчество
    last_name?: string;    // фамилия

    /** Токен */
    token?: string;
}

export interface IUserStore {
    data: User | null;
    setData(user: User | null): void;
    readonly isAuthorized: boolean;
}
export interface IRootStore {
    user: IUserStore;
}