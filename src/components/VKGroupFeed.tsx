import { useEffect, useState } from 'react';

const VK_SCREEN_NAME = 'calradia_band';

interface VKPostData {
  id: number;
  text: string;
  photo_url: string;
  posted_at: string;
}

export function VKGroupFeed() {
  const [posts, setPosts] = useState<VKPostData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/vk-posts/')
      .then((r) => r.json())
      .then((data) => {
        setPosts(data.posts ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <aside className="news-panel secondary-card">
      <div className="news-panel-head">
        <h3>Новости клуба</h3>
        <a href={`https://vk.com/${VK_SCREEN_NAME}`} target="_blank" rel="noreferrer">
          Все записи →
        </a>
      </div>
      {loaded && posts.length === 0 && (
        <p className="news-panel-fallback">Нет записей</p>
      )}
      {posts.map((post) => {
        const date = new Date(post.posted_at);
        const formattedDate = date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        return (
          <div className="vk-post" key={post.id}>
            <div className="vk-post-meta">{formattedDate}</div>
            {post.photo_url && <img className="vk-post-img" src={post.photo_url} alt="" />}
            {post.text && <p className="vk-post-text">{post.text}</p>}
          </div>
        );
      })}
    </aside>
  );
}
