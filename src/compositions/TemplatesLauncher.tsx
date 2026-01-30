import { AbsoluteFill, staticFile } from 'remotion';

export const TemplatesLauncher: React.FC = () => {
    // Hàm mở tab mới
    const openGallery = () => {
        // Dùng staticFile để lấy đúng đường dẫn resource
        const url = staticFile('templates.html');
        // staticFile trong Studio trả về /templates.html, open ở tab mới
        window.open(url, '_blank');
    };

    return (
        <AbsoluteFill style={{
            backgroundColor: '#0f172a',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            flexDirection: 'column',
            fontFamily: 'sans-serif'
        }}>
            <div style={{
                backgroundColor: '#1e293b',
                padding: '40px',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                border: '1px solid #334155'
            }}>
                <h1 style={{ margin: '0 0 10px 0', fontSize: '32px', color: '#60a5fa' }}>Lower Third Gallery</h1>
                <p style={{ color: '#94a3b8', marginBottom: '30px' }}>
                    Xem trước danh sách 40 mẫu thiết kế Lower Third
                </p>

                <button
                    onClick={openGallery}
                    style={{
                        padding: '15px 30px',
                        fontSize: '18px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#3b82f6')}
                >
                    MỞ GALLERY TRONG TAB MỚI ↗
                </button>

                <p style={{ marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
                    File nguồn: <code>public/templates.html</code>
                </p>
            </div>
        </AbsoluteFill>
    );
};
