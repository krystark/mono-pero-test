// hooks/useGateLoader.ts
import { useEffect, useState } from 'react';

type Phase = 'intro' | 'wait' | 'outro' | 'done';

export function useGateLoader(checkFinished: boolean) {
    const [phase, setPhase] = useState<Phase>('intro');

    // после монтирования быстро переходим в состояние ожидания
    useEffect(() => {
        if (phase === 'intro') setPhase('wait');
    }, [phase]);

    // как только все проверки закончены — запускаем выходную анимацию
    useEffect(() => {
        if (checkFinished && phase === 'wait') setPhase('outro');
    }, [checkFinished, phase]);

    const markDone = () => setPhase('done');

    return {
        phase,                 // 'intro' | 'wait' | 'outro' | 'done'
        visible: phase !== 'done',
        markDone,              // вызвать из лоадера по окончании анимации
    };
}
