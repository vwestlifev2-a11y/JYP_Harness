import { useState, useEffect } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<Provider>('google');
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  const hasEnvKey = envKeys[provider];

  const handleGenerate = (prompt: string) => {
    if (!apiKey.trim() && !hasEnvKey) {
      alert(`${PROVIDER_CONFIG[provider].label} API 키를 입력하거나 .env에 설정해주세요.`);
      return;
    }
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const activeProvider = PROVIDER_CONFIG[provider].label;

  return (
    <div className="app">
      <div className="desktop-bar"><span className="desktop-brand"><span aria-hidden="true">▦</span> Component studio</span><span>아이디어를 실행 가능한 UI로</span></div>
      <header className="app-header">
        <div className="brand-mark" aria-hidden="true">{'<'}<br />{'/>'}</div>
        <div className="header-copy">
          <h1>작은 아이디어의<br />큰 작업실.</h1>
          <p>만들고 싶은 UI를 적어보세요.<br />React 컴포넌트로 만들고, 바로 실행해보세요.</p>
        </div>
        <div className="header-meta" aria-label="현재 작업 상태">
          <div>
            <span>선택한 AI</span>
            <strong>{activeProvider}</strong>
          </div>
          <div>
            <span>생성한 컴포넌트</span>
            <strong>{components.length}<small>개</small></strong>
          </div>
        </div>
      </header>

      <main className="workspace">
        <section className="composer-panel" aria-label="컴포넌트 생성">
          <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />
        </section>

        <aside className="settings-panel" aria-label="실행 설정">
          <div className="settings-header">
            <h2><span aria-hidden="true">⚙</span> 연결 설정</h2>
          </div>
          <div className="provider-select">
            <label htmlFor="provider">사용할 AI</label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => handleProviderChange(e.target.value as Provider)}
            >
              {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="api-key-input">
            <label htmlFor="api-key">
              API Key
            </label>
            <div className="api-key-field">
              <input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasEnvKey
                    ? '서버 키 사용 중'
                    : PROVIDER_CONFIG[provider].placeholder
                }
              />
              <button
                className="btn-toggle-key"
                onClick={() => setShowKey(!showKey)}
                type="button"
              >
                {showKey ? '숨기기' : '보기'}
              </button>
            </div>
            <p className={`key-status ${hasEnvKey ? 'key-status--ready' : ''}`}>
              {hasEnvKey ? '직접 입력하면 입력한 키를 사용합니다.' : '직접 입력하거나 서버 환경변수를 설정하세요.'}
            </p>
          </div>
          <div className="settings-note"><span aria-hidden="true">ⓘ</span><p>키를 연결하면 준비 완료.<br />생성 결과에서 미리보기와 코드를 확인할 수 있어요.</p></div>
        </aside>
      </main>

      {error && (
        <div className="error-banner" role="alert">
          <p>{error}</p>
        </div>
      )}

      <section className="results-section">
          <div className="results-header">
            <div>
              <h2><span aria-hidden="true">▤</span> 컴포넌트 작업대 <span className="result-count">{components.length}</span></h2>
            </div>
            {components.length > 0 ? (
            <button className="btn-clear" onClick={clearAll}>
              전체 삭제
            </button>
            ) : <span className="results-hint">여기에 결과가 나타납니다</span>}
          </div>

        {components.length === 0 && !isLoading && (
          <div className="empty-state">
            <div className="empty-preview" aria-hidden="true">
              <div className="empty-window"><span>Untitled component</span><b>×</b></div>
              <div className="empty-canvas"><span className="empty-code">{'<YourIdea />'}</span><span className="empty-cursor" /></div>
            </div>
            <div className="empty-copy">
              <h2>아직은 빈 작업대예요.</h2>
              <p>위에 원하는 UI를 입력하거나 예시를 골라보세요.<br />첫 번째 컴포넌트가 여기서 시작됩니다.</p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="loading-card" role="status">
            <div className="loading-pulse" />
            <p>컴포넌트를 생성하고 있습니다...</p>
          </div>
        )}

        <div className="results-grid">
          {components.map((component) => (
            <ComponentCard
              key={component.id}
              component={component}
              onRemove={removeComponent}
              onRegenerate={handleGenerate}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>
      <footer className="desktop-footer"><span><i className={isLoading ? 'status-light status-light--busy' : 'status-light'} />{isLoading ? '컴포넌트 생성 중' : '작업 준비 완료'}</span><span>React로 만들고, 내 코드로 가져가세요.</span></footer>
    </div>
  );
}

export default App;
