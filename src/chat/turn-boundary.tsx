import { Component, type ReactNode } from "react"

type Props = { children: ReactNode; label: string }
type State = { error: Error | null }

/** One broken turn must not take the whole chat down; it shows its error inline instead. */
export class TurnBoundary extends Component<Props, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error(`[turn ${this.props.label}] render failed:`, error.message, error.stack)
  }
  render() {
    if (this.state.error) {
      return (
        <pre className="overflow-auto rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          {this.state.error.message}
          {"\n"}
          {this.state.error.stack}
        </pre>
      )
    }
    return this.props.children
  }
}
