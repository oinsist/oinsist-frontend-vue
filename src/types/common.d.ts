export interface PageQuery {
  pageNum: number
  pageSize: number
}

export interface PageResult<T> {
  rows: T[]
  total: number
}
