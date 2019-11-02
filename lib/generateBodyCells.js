const generateTable = require('./generateTable')
const { Table, Row, Data, AddressableCell } = require('./table_defs')
const { sortCells } = require('./utils')

function calcRowSpan (entity) {
  if (entity instanceof Table) {
    entity.rowSpan = entity._rows.reduce((sum, row) => sum + calcRowSpan(row), 0)
  } else if (entity instanceof Row) {
    const rowSpans = entity._cells.map(cell => calcRowSpan(cell))
    entity.rowSpan = Math.max(...rowSpans)
  } else if (entity instanceof Data) {
    entity.rowSpan = 1
  } else {
    throw new Error('未知的 entity 类型')
  }
  return entity.rowSpan
}

function convertTable (table, rowFrom, colFrom) {
  const _cells = [] // 让 _cell 命名为 { r: ?, c: ?, v: 1 } 格式
  let colSpanForReturn = null

  for (const row of table._rows) {
    // 这里不再考虑数据的空洞
    const [_rowCells, colSpan] = convertRow(row, rowFrom, colFrom)
    _cells.push(..._rowCells)

    colSpanForReturn = colSpan
    rowFrom += row.rowSpan
  }
  return [_cells, colSpanForReturn]
}

function convertRow (row, rowFrom, colFrom) {
  const originalColFrom = colFrom
  const _cells = []
  for (const cell of row._cells) {
    if (cell instanceof Table) {
      const [_colCells, usedColSpan] = convertTable(cell, rowFrom, colFrom)
      _cells.push(..._colCells)
      colFrom += usedColSpan
    } else {
      const _cell = new AddressableCell({ r: rowFrom, c: colFrom, rs: row.rowSpan, v: cell._val }) 
      _cells.push(_cell)
      colFrom += 1
    }
  }
  return [_cells, colFrom - originalColFrom]
}

module.exports = function (data, props) {
  const table = generateTable(data, props)
  calcRowSpan(table)
  const cells = convertTable(table, 1, 1)[0]
  return sortCells(cells)
}