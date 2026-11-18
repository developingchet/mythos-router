/**
 * `off`: only the Mythos agent types run on Mythos. `on`: also
 * general-purpose and workflow agents whose caller named no model. `all`:
 * every new subagent.
 */
export type RoutingMode = 'off' | 'on' | 'all'

declare module 'claude-code' {
  interface PluginState {
    'mythos-router': {
      /** The mode `/mythos-subagents` set this session; null until it is used. */
      routing: RoutingMode | null
    }
  }
}
