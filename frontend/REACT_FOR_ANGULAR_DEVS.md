# React Portfolio — Guide for Angular Developers
> You already know Angular. This maps every React concept to what you already know.

---

## Project Structure — Angular vs React

```
Angular (novopay)                    React (reactFolio)
─────────────────────────────────────────────────────────
src/
  app/                               src/
    core/                              core/
      services/                          store/
        auth.service.ts                    useStore.js       ← singleton state
      guards/
      interceptors/

    shared/                            shared/
      components/                        components/
        nav/                               nav/Nav.jsx
        ...                                hero/Hero.jsx
      pipes/                               FilmGrain.jsx
      directives/

    feature-module/                    features/
      component.ts                       system/
      component.html                       SystemWorld.jsx   ← smart component
      component.scss                       scenes/           ← dumb/presentational
      module.ts                            components/
      routing.module.ts                  human/
                                           HumanWorld.jsx
                                           chapters/
                                         zones/GestureZones.jsx
                                         terminal/AiTerminal.jsx
                                         transition/WorldTransition.jsx
                                         password/PasswordGate.jsx

  styles.scss                          styles/
  environments/                          index.css
  assets/                              assets/
    fonts/                               fonts/

  main.ts                              main.jsx
  app.module.ts                        App.jsx
  app.component.ts                     App.jsx
```

---

## Core Concepts — 1:1 Mapping

### Component

```typescript
// Angular
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent {
  mode = 'system';
}
```

```jsx
// React
export default function Nav() {
  const mode = 'system';
  return <nav>...</nav>;   // template is inside the function, not separate
}
```

> **Key difference:** In React, the template (HTML) lives inside the function as JSX.
> There is no separate `.html` or `.scss` file per component.

---

### State Management

```typescript
// Angular — NgRx Store / BehaviorSubject
@Injectable({ providedIn: 'root' })
export class AppStore {
  private mode$ = new BehaviorSubject<string>('system');
  mode = this.mode$.asObservable();
  setMode(m: string) { this.mode$.next(m); }
}
```

```js
// React — Zustand (src/core/store/useStore.js)
const useStore = create((set) => ({
  mode: 'system',
  setMode: (mode) => set({ mode }),
}));
```

> **Zustand = your Angular singleton service with BehaviorSubject.**
> Any component calls `useStore()` to read/write — no module injection needed.

---

### Consuming State

```typescript
// Angular
export class NavComponent {
  constructor(private store: AppStore) {}
  mode$ = this.store.mode;   // subscribe in template with async pipe
}
```

```jsx
// React
export default function Nav() {
  const { mode } = useStore();   // auto re-renders when mode changes
  return <div>{mode}</div>;
}
```

> **`useStore()` = constructor injection + async pipe, combined.**
> No subscriptions, no unsubscribe, no async pipe. Just call it.

---

### Inputs / Outputs (Props)

```typescript
// Angular
@Input() title: string;
@Output() clicked = new EventEmitter<void>();
```

```jsx
// React
export default function Card({ title, onClicked }) {
  return <div onClick={onClicked}>{title}</div>;
}
```

> **Props = @Input. Callback functions = @Output.** No EventEmitter needed.

---

### Lifecycle Hooks

| Angular              | React (useEffect)                          |
|----------------------|--------------------------------------------|
| `ngOnInit()`         | `useEffect(() => { }, [])`                 |
| `ngOnChanges()`      | `useEffect(() => { }, [dependency])`       |
| `ngOnDestroy()`      | `return () => { }` inside useEffect        |
| `ngAfterViewInit()`  | `useEffect` + `useRef`                     |

```jsx
// React equivalent of ngOnInit + ngOnDestroy
useEffect(() => {
  window.addEventListener('keydown', handler);   // ngOnInit
  return () => window.removeEventListener('keydown', handler);  // ngOnDestroy
}, []);  // [] = run once, like ngOnInit
```

---

### Template Variables / DOM Refs

```typescript
// Angular
@ViewChild('inputEl') inputEl: ElementRef;
this.inputEl.nativeElement.focus();
```

```jsx
// React
const inputRef = useRef(null);
inputRef.current.focus();
// In template: <input ref={inputRef} />
```

---

### Structural Directives

| Angular              | React JSX                              |
|----------------------|----------------------------------------|
| `*ngIf="show"`       | `{show && <Component />}`              |
| `*ngFor="let x of y"`| `{y.map(x => <Item key={x.id} />)}`   |
| `*ngSwitch`          | Ternary or `switch` inside JSX         |

---

### Routing / Lazy Loading

```typescript
// Angular routing module
{ path: 'system', loadChildren: () => import('./system/system.module') }
```

```jsx
// React lazy loading (App.jsx)
const SystemWorld = lazy(() => import('@features/system/SystemWorld'));
const HumanWorld  = lazy(() => import('@features/human/HumanWorld'));
// Wrapped in <Suspense fallback={...}> like Angular's loading state
```

> **No RouterModule needed.** This project uses conditional rendering instead of
> URL-based routing — `mode === 'system' ? <SystemWorld /> : <HumanWorld />`.

---

### Services / API Calls

```typescript
// Angular
@Injectable({ providedIn: 'root' })
export class ChatService {
  sendMessage(msg: string) {
    return this.http.post('/api/chat', { message: msg });
  }
}
```

```jsx
// React — inline fetch (AiTerminal.jsx)
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message }),
});
```

> For a small project, fetch is inline. For larger projects, extract to
> `src/core/api/chat.api.js` — same as your Angular services pattern.

---

### Styling

| Angular                            | React (this project)                    |
|------------------------------------|-----------------------------------------|
| `component.scss` scoped styles     | Inline `style={{}}` props               |
| `styles.scss` global               | `src/styles/index.css` global           |
| `::ng-deep` for overrides          | CSS class in `index.css`                |
| Tailwind via PostCSS               | Tailwind (same, via PostCSS)            |

> This project intentionally uses **inline styles** for dynamic values
> (colors, opacity, transitions that depend on state) and **Tailwind** for layout.

---

### Path Aliases (same concept as Angular's tsconfig paths)

```json
// Angular tsconfig.json
"paths": {
  "@app/*": ["src/app/*"],
  "@shared/*": ["src/app/shared/*"]
}
```

```js
// React vite.config.js
alias: {
  '@core':     'src/core',      // singleton store, hooks, api
  '@shared':   'src/shared',    // reusable components
  '@features': 'src/features',  // feature areas (system, human, terminal...)
  '@styles':   'src/styles',    // global CSS
  '@assets':   'src/assets',    // fonts, images
}
```

---

## "Where do I add a new ___?"

| What you want to add              | Where to put it                             |
|-----------------------------------|---------------------------------------------|
| New page / world / section        | `src/features/your-feature/`                |
| Reusable UI component             | `src/shared/components/your-component/`     |
| Global state (new Zustand slice)  | `src/core/store/useStore.js`                |
| API call helper                   | `src/core/api/your.api.js`                  |
| Custom hook (like Angular service)| `src/core/hooks/useYourHook.js`             |
| Global CSS                        | `src/styles/index.css`                      |
| New font / image                  | `src/assets/`                               |

---

## Quick Reference

```
Angular concept          React equivalent
───────────────────────────────────────────
NgModule                 — (not needed, Vite handles it)
AppModule                App.jsx
Component class          function Component() {}
Template                 JSX inside the function
@Input()                 function Comp({ propName })
@Output() + emit()       function Comp({ onEvent }) → onEvent()
ngOnInit                 useEffect(() => {}, [])
ngOnDestroy              return () => {} inside useEffect
@ViewChild               useRef()
*ngIf                    {condition && <Component />}
*ngFor                   {array.map(item => <Item />)}
async pipe               just read from useStore() directly
Injectable service       useStore.js (Zustand) or custom hook
BehaviorSubject          Zustand state slice
RouterModule             lazy() + <Suspense>
HttpClient               fetch() or axios
scss per component       inline style={{}} or Tailwind classes
styles.scss              src/styles/index.css
environment.ts           .env (VITE_API_URL=...)
tsconfig paths           vite.config.js resolve.alias
```
