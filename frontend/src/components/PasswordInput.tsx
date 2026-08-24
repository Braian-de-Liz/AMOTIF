import { useState, type ComponentPropsWithoutRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordInputProps = Omit<ComponentPropsWithoutRef<'input'>, 'type'>;

function PasswordInput({ className, ...props }: PasswordInputProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="password-input">
            <input
                {...props}
                className={className}
                type={isVisible ? 'text' : 'password'}
            />
            <button
                type="button"
                className="password-toggle"
                onClick={() => setIsVisible((visible) => !visible)}
                aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={isVisible}
                title={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
            >
                {isVisible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
            </button>
        </div>
    );
}

export { PasswordInput };
