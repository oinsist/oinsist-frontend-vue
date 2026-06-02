export interface MetaVo {
  title: string
  icon: string
  noCache: boolean
  hidden: boolean
}

export interface RouterVo {
  name: string
  path: string
  component: string
  meta: MetaVo
  hidden: boolean
  children?: RouterVo[] | null
}
