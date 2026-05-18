declare global {
  interface Window {
    VK?: {
      init: (opts: { apiId: number; onlyWidgets?: boolean }) => void;
      Widgets: {
        Group: (elementId: string, opts: object, groupId: number) => void;
      };
    };
    vkAsyncInit?: () => void;
  }
}

const VK_SCREEN_NAME = 'calradia_band';
// Числовой ID группы ВКонтакте — узнать: перейди на vk.com/calradia_band,
// открой исходный код страницы и найди "group_id" или "owner_id".
// Вставь число ниже (без минуса) и раскомментируй строки в useEffect.
const VK_GROUP_ID: number | null = 238824374;
const VK_APP_ID = 0; // замени на ID своего VK-приложения из vk.com/apps?act=manage

import { useEffect, useRef } from 'react';

export function VKGroupFeed() {
  const done = useRef(false);

  useEffect(() => {
    if (!VK_GROUP_ID || done.current) return;
    done.current = true;

    const render = () => {
      window.VK?.Widgets.Group('vk_group_feed', {
        mode: 4,
        width: 'auto',
        height: '500',
        color1: '12120c',
        color2: 'c1c8bc',
        color3: 'd1b68c',
      }, VK_GROUP_ID!);
    };

    if (window.VK?.Widgets) {
      if (VK_APP_ID) window.VK.init({ apiId: VK_APP_ID, onlyWidgets: true });
      render();
    } else {
      window.vkAsyncInit = () => {
        if (VK_APP_ID) window.VK!.init({ apiId: VK_APP_ID, onlyWidgets: true });
        render();
      };
      const s = document.createElement('script');
      s.src = 'https://vk.com/js/api/openapi.js?169';
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  if (VK_GROUP_ID) {
    return (
      <aside className="news-panel secondary-card">
        <div className="news-panel-head">
          <h3>Новости клуба</h3>
          <a href={`https://vk.com/${VK_SCREEN_NAME}`} target="_blank" rel="noreferrer">
            Все записи →
          </a>
        </div>
        <div id="vk_group_feed" />
      </aside>
    );
  }

  return (
    <aside className="news-panel secondary-card">
      <div className="news-panel-head">
        <h3>Новости клуба</h3>
        <a href={`https://vk.com/${VK_SCREEN_NAME}`} target="_blank" rel="noreferrer">
          Все записи →
        </a>
      </div>
      <div className="news-panel-vk">
        <div className="news-panel-vk-icon">VK</div>
        <p className="news-panel-vk-name">Калрадия — Боевое братство</p>
        <p className="news-panel-vk-desc">
          Новости фестивалей, фото с бугуртов и анонсы мастерской — всё в нашей группе ВКонтакте.
        </p>
        <a
          className="cta-button news-panel-vk-btn"
          href={`https://vk.com/${VK_SCREEN_NAME}`}
          target="_blank"
          rel="noreferrer"
        >
          Перейти в группу
        </a>
      </div>
    </aside>
  );
}
