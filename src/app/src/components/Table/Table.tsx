import React from "react"
import "./index.scss"

export interface ColumnsType {
    title: string
    dataIndex: string
    key: string
    render?: (value: unknown, record: unknown, index: number) => React.ReactNode
    width?: number | string
}

interface TableProps {
    columns: ColumnsType[]
    dataSource: unknown[]
    rowKey?: string
    className?: string
}

export function Table({ 
    columns, 
    dataSource, 
    rowKey = "key",
    className = "" 
}: TableProps) {
    return (
        <div className={`table-wrapper ${className}`}>
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} style={{ width: col.width }}>
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {dataSource.map((record, index) => (
                        <tr key={record[rowKey] || index}>
                            {columns.map((col) => (
                                <td key={col.key}>
                                    {col.render 
                                        ? col.render(record[col.dataIndex as keyof typeof record], record, index)
                                        : String(record[col.dataIndex as keyof typeof record] ?? "")
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}