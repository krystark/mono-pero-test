import React, { useState } from 'react';
import { Input, Button } from '@krystark/ui-kit-components';

export default function AuthGate() {
    const [loading, setLoading] = useState(false);

    const handleAuth = () => {
        setLoading(true);
        window.location.href = `${import.meta.env.VITE_API_URL}login/bitrix?source=${import.meta.env.VITE_KEY_LOGIN}`;
    };

    return (
        <div
            className="h-screen overflow-hidden flex items-center justify-center bg-primary desktop:bg-secondary relative">

            <div className="w-full max-w-[518px] rounded bg-primary p-[40px] relative z-[1]">
                <h2 className="text-[36px] leading-[40px] font-semibold text-center mb-10 text-text">
                    Добро пожаловать!
                </h2>

                <div className="flex flex-col gap-4 mb-[40px]">
                    <Input label="Логин" name="login" placeholder="Введите логин" disabled />
                    <Input label="Пароль" type="password" name="password" placeholder="Введите пароль"  disabled/>
                </div>

                <Button
                    size="lg"
                    variant="primary"
                    loading={loading}
                    onClick={handleAuth}
                    className="w-full"
                >
                    Авторизация через Битрикс 24
                </Button>
            </div>

            <img className="absolute inset-0 m-auto h-full hidden desktop:block" src={`${import.meta.env.VITE_PATH_URL}img/auth.svg`} />
        </div>
    );
}
