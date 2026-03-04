import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorLocation: string;
}

/**
 * ErrorBoundary — 全局错误边界
 * 修复：监听 URL 变化，路由切换时自动清除错误状态，
 * 避免某个页面出错后整个应用卡死，只能刷新才能恢复。
 */
class ErrorBoundary extends Component<Props, State> {
  private unlisten: (() => void) | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorLocation: "" };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorLocation: window.location.pathname };
  }

  componentDidMount() {
    // 监听 popstate（浏览器前进/后退）
    const handlePop = () => this.resetOnRouteChange();
    window.addEventListener("popstate", handlePop);

    // 拦截 history.pushState / replaceState（wouter 路由跳转）
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (...args) => {
      origPush(...args);
      this.resetOnRouteChange();
    };
    history.replaceState = (...args) => {
      origReplace(...args);
      this.resetOnRouteChange();
    };

    this.unlisten = () => {
      window.removeEventListener("popstate", handlePop);
      history.pushState = origPush;
      history.replaceState = origReplace;
    };
  }

  componentWillUnmount() {
    this.unlisten?.();
  }

  resetOnRouteChange() {
    // 只有当前路径与出错时的路径不同时才重置，避免同页面重复触发
    if (this.state.hasError && window.location.pathname !== this.state.errorLocation) {
      this.setState({ hasError: false, error: null, errorLocation: "" });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
