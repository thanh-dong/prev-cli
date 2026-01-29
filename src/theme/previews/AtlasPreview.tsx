import React, { useState, useEffect } from 'react'
import type { PreviewUnit, AtlasDefinition } from '../../vite/preview-types'

interface AtlasNode {
  id: string
  title: string
  ref?: string
}

interface AtlasRelationship {
  from: string
  to: string
  type: string
}

interface AtlasConfig {
  title?: string
  description?: string
  nodes?: AtlasNode[]
  relationships?: AtlasRelationship[]
}

interface AtlasPreviewProps {
  unit: PreviewUnit
}

type ViewMode = 'tree' | 'map' | 'navigate'

// Transform new config format (nodes/relationships) to legacy hierarchy format
function transformToHierarchy(config: AtlasConfig): AtlasDefinition | null {
  if (!config.nodes || config.nodes.length === 0) return null

  // Build areas map from nodes
  const areas: Record<string, { title: string; children?: string[]; description?: string }> = {}
  for (const node of config.nodes) {
    areas[node.id] = { title: node.title, children: [] }
  }

  // Build parent-child relationships from 'contains' type relationships
  // or infer from relationship patterns
  const childrenMap: Record<string, string[]> = {}
  const hasParent = new Set<string>()

  if (config.relationships) {
    for (const rel of config.relationships) {
      if (rel.type === 'contains' || rel.type === 'parent') {
        if (!childrenMap[rel.from]) childrenMap[rel.from] = []
        childrenMap[rel.from].push(rel.to)
        hasParent.add(rel.to)
      }
    }
  }

  // Apply children to areas
  for (const [parentId, children] of Object.entries(childrenMap)) {
    if (areas[parentId]) {
      areas[parentId].children = children
    }
  }

  // Find root (node with no parent, or first node)
  const root = config.nodes.find(n => !hasParent.has(n.id))?.id || config.nodes[0]?.id || 'root'

  return {
    name: config.title || 'Atlas',
    description: config.description,
    hierarchy: { root, areas },
    relationships: config.relationships,
  }
}

export function AtlasPreview({ unit }: AtlasPreviewProps) {
  const [atlas, setAtlas] = useState<AtlasDefinition | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  // Load atlas definition - use config for static builds, fetch for dev
  useEffect(() => {
    const config = unit.config as AtlasConfig | undefined

    // Try to use embedded config first (for static builds)
    if (config?.nodes && config.nodes.length > 0) {
      const transformed = transformToHierarchy(config)
      if (transformed) {
        setAtlas(transformed)
        setSelectedArea(transformed.hierarchy?.root || null)
        setLoading(false)
        return
      }
    }

    // Fall back to fetching for dev mode
    fetch(`/_preview-config/atlas/${unit.name}`)
      .then(res => res.json())
      .then(data => {
        setAtlas(data)
        setSelectedArea(data.hierarchy?.root || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [unit.name, unit.config])

  if (loading) {
    return (
      <div style={{
        padding: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--fd-card)',
        borderRadius: '16px',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid var(--fd-border)',
          borderTopColor: 'oklch(0.55 0.18 280)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (!atlas || !atlas.hierarchy) {
    return (
      <div style={{
        padding: '48px',
        textAlign: 'center',
        backgroundColor: 'var(--fd-card)',
        borderRadius: '16px',
        border: '1px solid var(--fd-border)',
        boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.08)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'oklch(0.94 0.06 85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '24px',
        }}>
          ⚠
        </div>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: 600,
          color: 'var(--fd-foreground)',
        }}>
          {unit.config?.title || unit.name}
        </h2>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: 'var(--fd-muted-foreground)',
        }}>
          {atlas ? 'This atlas has no hierarchy defined.' : 'Failed to load atlas definition.'}
        </p>
      </div>
    )
  }

  // Tree view with cycle detection
  const renderTree = (areaId: string, depth = 0, visited = new Set<string>()): React.ReactNode => {
    // Cycle detection
    if (visited.has(areaId)) {
      return (
        <div
          key={`cycle-${areaId}-${depth}`}
          style={{
            marginLeft: `${depth * 20}px`,
            padding: '8px 12px',
            color: 'oklch(0.65 0.20 25)',
            fontSize: '13px',
            fontStyle: 'italic',
          }}
        >
          ↻ Cycle detected: {areaId}
        </div>
      )
    }
    visited.add(areaId)

    const area = atlas.hierarchy.areas[areaId]
    if (!area) {
      return (
        <div
          key={`missing-${areaId}-${depth}`}
          style={{
            marginLeft: `${depth * 20}px`,
            padding: '8px 12px',
            color: 'var(--fd-muted-foreground)',
            fontSize: '13px',
            fontStyle: 'italic',
          }}
        >
          ⚠ Missing area: {areaId}
        </div>
      )
    }

    const hasChildren = area.children && area.children.length > 0
    const isSelected = selectedArea === areaId
    const isRoot = depth === 0

    return (
      <div key={`${areaId}-${depth}`}>
        <button
          onClick={() => setSelectedArea(areaId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: `calc(100% - ${depth * 20}px)`,
            textAlign: 'left',
            marginLeft: `${depth * 20}px`,
            padding: '10px 14px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: isSelected
              ? 'oklch(0.55 0.18 280)'
              : 'transparent',
            color: isSelected ? 'white' : 'var(--fd-foreground)',
            fontSize: '14px',
            fontWeight: isSelected ? 600 : isRoot ? 500 : 400,
            transition: 'all 0.15s ease',
            marginBottom: '2px',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'var(--fd-muted)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          {/* Node icon */}
          <span style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            backgroundColor: isSelected
              ? 'rgba(255, 255, 255, 0.2)'
              : isRoot
                ? 'oklch(0.92 0.05 280)'
                : 'var(--fd-muted)',
            color: isSelected
              ? 'white'
              : isRoot
                ? 'oklch(0.45 0.15 280)'
                : 'var(--fd-muted-foreground)',
            fontSize: '12px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {isRoot ? '◉' : hasChildren ? '◈' : '○'}
          </span>

          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {area.title}
          </span>

          {area.access && (
            <span style={{
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 500,
              borderRadius: '4px',
              backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--fd-muted)',
              color: isSelected ? 'white' : 'var(--fd-muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {area.access}
            </span>
          )}

          {hasChildren && (
            <span style={{
              color: isSelected ? 'rgba(255,255,255,0.6)' : 'var(--fd-muted-foreground)',
              fontSize: '12px',
            }}>
              {area.children?.length}
            </span>
          )}
        </button>
        {hasChildren && area.children?.map(childId =>
          renderTree(childId, depth + 1, new Set(visited))
        )}
      </div>
    )
  }

  // Navigate view: sidebar + screen preview
  const renderNavigateView = () => {
    const selectedAreaData = selectedArea ? atlas.hierarchy.areas[selectedArea] : null
    const routes = atlas.routes || {}
    const areaRoutes = Object.entries(routes).filter(([, r]) => r.area === selectedArea)

    return (
      <div style={{
        display: 'flex',
        gap: '24px',
        padding: '24px',
        backgroundColor: 'oklch(0.15 0.01 280)',
        backgroundImage: `
          linear-gradient(oklch(0.20 0.01 280) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.20 0.01 280) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        minHeight: '400px',
      }}>
        {/* Sidebar */}
        <div style={{
          width: '300px',
          flexShrink: 0,
          backgroundColor: 'var(--fd-card)',
          borderRadius: '12px',
          padding: '16px',
          overflow: 'auto',
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.2)',
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--fd-muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Areas
          </h3>
          {renderTree(atlas.hierarchy.root)}
        </div>

        {/* Screen preview area */}
        <div style={{
          flex: 1,
          backgroundColor: 'var(--fd-card)',
          borderRadius: '12px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.2)',
        }}>
          {selectedAreaData ? (
            <>
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, oklch(0.55 0.18 280) 0%, oklch(0.45 0.20 320) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                  }}>
                    ◉
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--fd-foreground)',
                    letterSpacing: '-0.02em',
                  }}>
                    {selectedAreaData.title}
                  </h3>
                </div>
                {selectedAreaData.description && (
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--fd-muted-foreground)',
                    paddingLeft: '48px',
                  }}>
                    {selectedAreaData.description}
                  </p>
                )}
              </div>

              {/* Routes in this area */}
              {areaRoutes.length > 0 ? (
                <div>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--fd-muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}>
                    Routes
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {areaRoutes.map(([path, route]) => (
                      <div
                        key={path}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: 'var(--fd-muted)',
                          borderRadius: '8px',
                          border: '1px solid var(--fd-border)',
                          transition: 'border-color 0.15s ease',
                        }}
                      >
                        <div style={{
                          fontFamily: 'var(--fd-font-mono)',
                          color: 'oklch(0.55 0.18 280)',
                          marginBottom: '6px',
                          fontSize: '13px',
                          fontWeight: 500,
                        }}>
                          {path}
                        </div>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          color: 'var(--fd-muted-foreground)',
                          fontSize: '12px',
                        }}>
                          <span>Screen: <strong style={{ color: 'var(--fd-foreground)' }}>{route.screen}</strong></span>
                          {route.guard && (
                            <span style={{
                              padding: '2px 6px',
                              backgroundColor: 'oklch(0.94 0.08 25)',
                              color: 'oklch(0.50 0.15 25)',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 500,
                            }}>
                              {route.guard}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--fd-muted-foreground)',
                  fontSize: '14px',
                  padding: '40px',
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--fd-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px',
                    fontSize: '20px',
                  }}>
                    ∅
                  </div>
                  No routes defined for this area
                </div>
              )}
            </>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--fd-muted-foreground)',
              fontSize: '14px',
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--fd-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px',
                fontSize: '20px',
              }}>
                ←
              </div>
              Select an area to view details
            </div>
          )}
        </div>
      </div>
    )
  }

  // Map view: placeholder for future D2/Mermaid diagram
  const renderMapView = () => {
    return (
      <div style={{
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'oklch(0.15 0.01 280)',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, oklch(0.25 0.08 280 / 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, oklch(0.25 0.08 320 / 0.3) 0%, transparent 50%)
        `,
        minHeight: '400px',
      }}>
        <div style={{
          padding: '32px 48px',
          backgroundColor: 'var(--fd-card)',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, oklch(0.55 0.18 280) 0%, oklch(0.45 0.20 320) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '28px',
            color: 'white',
          }}>
            ◇
          </div>
          <h3 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 600,
            color: 'var(--fd-foreground)',
          }}>
            Map View
          </h3>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--fd-muted-foreground)',
          }}>
            D2/Mermaid diagram visualization coming soon
          </p>
        </div>
      </div>
    )
  }

  // Tree view: full hierarchy
  const renderTreeView = () => {
    return (
      <div style={{
        padding: '24px',
        backgroundColor: 'oklch(0.15 0.01 280)',
        backgroundImage: `
          linear-gradient(oklch(0.20 0.01 280) 1px, transparent 1px),
          linear-gradient(90deg, oklch(0.20 0.01 280) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '350px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: 'var(--fd-card)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}>
          {renderTree(atlas.hierarchy.root)}
        </div>
      </div>
    )
  }

  const viewModeButtons: { mode: ViewMode; label: string; icon: string }[] = [
    { mode: 'tree', label: 'Tree', icon: '⊞' },
    { mode: 'map', label: 'Map', icon: '◇' },
    { mode: 'navigate', label: 'Navigate', icon: '⇢' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '16px',
        overflow: 'hidden',
        backgroundColor: 'var(--fd-card)',
        boxShadow: isHovered
          ? '0 20px 40px -12px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)'
          : '0 4px 20px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        background: 'linear-gradient(to bottom, var(--fd-card), var(--fd-muted))',
        borderBottom: '1px solid var(--fd-border)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Atlas icon */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, oklch(0.55 0.18 280) 0%, oklch(0.45 0.20 320) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '18px',
              boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.25)',
            }}>
              ◈
            </div>

            <div>
              <h2 style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--fd-foreground)',
                letterSpacing: '-0.02em',
              }}>
                {atlas.name}
              </h2>
              {atlas.description && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: 'var(--fd-muted-foreground)',
                }}>
                  {atlas.description}
                </p>
              )}
            </div>
          </div>

          {/* View mode toggle */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--fd-muted)',
            borderRadius: '8px',
            padding: '4px',
          }}>
            {viewModeButtons.map(({ mode, label, icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  backgroundColor: viewMode === mode ? 'var(--fd-card)' : 'transparent',
                  color: viewMode === mode ? 'var(--fd-foreground)' : 'var(--fd-muted-foreground)',
                  fontWeight: viewMode === mode ? 600 : 400,
                  boxShadow: viewMode === mode ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '14px' }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'tree' && renderTreeView()}
      {viewMode === 'map' && renderMapView()}
      {viewMode === 'navigate' && renderNavigateView()}

      {/* Relationships section */}
      {atlas.relationships && atlas.relationships.length > 0 && (
        <div style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--fd-border)',
          backgroundColor: 'var(--fd-card)',
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--fd-muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            Relationships
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
          }}>
            {atlas.relationships.map((rel, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--fd-muted)',
                  borderRadius: '8px',
                  border: '1px solid var(--fd-border)',
                  fontSize: '13px',
                }}
              >
                <span style={{
                  color: 'var(--fd-foreground)',
                  fontWeight: 500,
                }}>
                  {atlas.hierarchy.areas[rel.from]?.title || rel.from}
                </span>
                <span style={{
                  padding: '3px 8px',
                  backgroundColor: 'oklch(0.92 0.08 280)',
                  color: 'oklch(0.45 0.15 280)',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}>
                  {rel.type}
                </span>
                <span style={{
                  color: 'var(--fd-foreground)',
                  fontWeight: 500,
                }}>
                  {atlas.hierarchy.areas[rel.to]?.title || rel.to}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {unit.config?.tags && unit.config.tags.length > 0 && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--fd-border)',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          backgroundColor: 'var(--fd-card)',
        }}>
          {unit.config.tags.map(tag => (
            <span
              key={tag}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: 'var(--fd-muted)',
                color: 'var(--fd-muted-foreground)',
                borderRadius: '100px',
                border: '1px solid var(--fd-border)',
                transition: 'all 0.15s ease',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
