// Atlas is the layout baseline (as in ALwith Desktop and U): a sliding track with a leading screen,
// a persistent navigation column and the workspace. Hosts own the title row and the content.
import { Atlas, AtlasNavigation, AtlasRegion } from "@nyssance/atlas/react"
import type { ReactNode } from "react"

export function Shell({ leading, navigation, children }: { leading: ReactNode; navigation: ReactNode; children: ReactNode }) {
  return (
    <Atlas
      className="h-full"
      data-atlas-layout="navigation"
      options={{ initialRegion: "workspace", insetTop: 0, flickMinIndex: 1 }}
      tabIndex={0}
      role="group"
      aria-label="Workspace"
    >
      <AtlasRegion id="leading" data-atlas-leading className="h-full">
        {leading}
      </AtlasRegion>
      <AtlasNavigation className="h-full">
        <div data-atlas-navigation-surface className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
          {navigation}
        </div>
      </AtlasNavigation>
      <AtlasRegion id="workspace" className="h-full">
        {children}
      </AtlasRegion>
    </Atlas>
  )
}
