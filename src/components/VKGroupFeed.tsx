import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    VK?: {
      Widgets: {
        Group: (elementId: string, opts: object, groupId: number) => void;
      };
    };
    vkAsyncInit?: () => void;
  }
}

const VK_SCREEN_NAME = 'calradia_band';

export function VKGroupFeed() {
  const [failed, setFailed] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const mountWidget = (groupId: number) => {
      const render = () => {
        window.VK?.Widgets.Group('vk_group_feed', {
          mode: 4,
          width: 'auto',
          height: '520',
          color1: '12120c',
          color2: 'c1c8bc',
          color3: 'd1b68c',
        }, groupId);
      };

      if (window.VK?.Widgets) {
        render();
      } else {
        window.vkAsyncInit = render;
        const s = document.createElement('script');
        s.src = 'https://vk.com/js/api/openapi.js?169';
        s.async = true;
        document.head.appendChild(s);
      }
    };

    fetch(`https://api.vk.com/method/utils.resolveScreenName?screen_name=${VK_SCREEN_NAME}&v=5.131`)
      .then((r) => r.json())
      .then((data) => {
        const id: number | undefined = data?.response?.object_id;
        if (id) mountWidget(id);
        else setFailed(true);
      })
      .catch(() => setFailed(true));
  }, []);

  return (
    <aside className="news-panel secondary-card">
      <div className="news-panel-head">
        <h3>Новости клуба</h3>
        <a href={`https://vk.com/${VK_SCREEN_NAME}`} target="_blank" rel="noreferrer">
          Все записи →
        </a>
      </div>

      {failed ? (
        <div className="news-panel-fallback">
          <p>Следи за нами ВКонтакте</p>
          <a
            className="cta-button"
            href={`https://vk.com/${VK_SCREEN_NAME}`}
            target="_blank"
            rel="noreferrer"
          >
            Открыть группу
          </a>
        </div>
      ) : (
        <div id="vk_group_feed" />
      )}
    </aside>
  );
}
