interface AvatarProps {
    src?: string | null
    name: string
    size?: number
}

function Avatar({ src, name, size = 50 }: AvatarProps) {
    const initial = name?.charAt(0)?.toUpperCase() || '?';

    if (src) {
        return (
            <img
                src={src}
                alt={name}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
            />
        );
    }

    return (
        <div
            className="avatar-placeholder"
            style={{ width: size, height: size, fontSize: size * 0.4 }}
        >
            {initial}
        </div>
    );
}

export { Avatar };
