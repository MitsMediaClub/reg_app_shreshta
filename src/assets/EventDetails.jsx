import React, { useEffect, useState } from 'react';
import { useTable, useFilters, useGlobalFilter, useSortBy, usePagination } from 'react-table';
import { matchSorter } from 'match-sorter';
import styled from 'styled-components';
import callApi from '../utils/callApi';
import { useGlobalContext } from '../context';
// Define a default UI for filtering
function DefaultColumnFilter({ column: { filterValue, preFilteredRows, setFilter } }) {
    const count = preFilteredRows.length;
    return (
        <input
            value={filterValue || ''}
            onChange={(e) => {
                setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
            }}
            placeholder={`Search ${count} records...`}
        />
    );
}
// Fuzzy text search essentially means approximate string matching and is a way of looking up strings that match a pattern even if the characters are not in the correct order.
function fuzzyTextFilterFn(rows, id, filterValue) {
    return matchSorter(rows, filterValue, { keys: [(row) => row.values[id]] });
}
// Let the table remove the filter if the string is empty
fuzzyTextFilterFn.autoRemove = (val) => !val;
// Our table component
function Table({ columns, data }) {
    const filterTypes = React.useMemo(
        () => ({
            fuzzyText: fuzzyTextFilterFn,
            text: (rows, id, filterValue) => {
                return rows.filter((row) => {
                    const rowValue = row.values[id];
                    return rowValue !== undefined
                        ? String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
                        : true;
                });
            },
        }),
        []
    );
    const defaultColumn = React.useMemo(
        () => ({
            // Let's set up our default Filter UI
            Filter: DefaultColumnFilter,
        }),
        []
    );
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        prepareRow,
        page,
        visibleColumns,
        canPreviousPage,
        canNextPage,
        pageOptions,
        pageCount,
        gotoPage,
        nextPage,
        previousPage,
        setPageSize,
        state: { pageIndex, pageSize },
    } = useTable(
        {
            columns,
            data,
            defaultColumn, // Be sure to pass the defaultColumn option
            filterTypes,
            initialState: { pageIndex: 0 },
        },
        useFilters,
        useGlobalFilter,
        useSortBy,
        usePagination
    );
    return (
        <>
            <Wrapper>
                <div className="container">
                    <div>
                        <h1>EVENT DETAILS</h1>
                        <table {...getTableProps()} cellPadding={0} cellSpacing={0}>
                            <thead>
                                {headerGroups.map((headerGroup) => (
                                    <tr {...headerGroup.getHeaderGroupProps()}>
                                        {headerGroup.headers.map((column) => (
                                            // Add the sorting props to control sorting. For this example
                                            // we can add them into the header props
                                            <th>
                                                <div {...column.getHeaderProps(column.getSortByToggleProps())}>
                                                    {column.render('Header')}
                                                    {/* Add a sort direction indicator */}
                                                    <span>{column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}</span>
                                                </div>
                                                <div>
                                                    {/* Render the columns filter UI */}
                                                    <div>{column.canFilter ? column.render('Filter') : null}</div>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                                <tr>
                                    <th
                                        colSpan={visibleColumns.length}
                                        style={{
                                            textAlign: 'left',
                                        }}
                                    ></th>
                                </tr>
                            </thead>
                            <tbody {...getTableBodyProps()}>
                                {page.map((row, i) => {
                                    prepareRow(row);
                                    return (
                                        <tr {...row.getRowProps()}>
                                            {row.cells.map((cell) => {
                                                return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>;
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <br />
                        <div className="pagination">
                            <div>
                                <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
                                    {'<<'}
                                </button>{' '}
                                <button onClick={() => previousPage()} disabled={!canPreviousPage}>
                                    {'<'}
                                </button>{' '}
                                <button onClick={() => nextPage()} disabled={!canNextPage}>
                                    {'>'}
                                </button>{' '}
                                <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
                                    {'>>'}
                                </button>{' '}
                                <span>
                                    Page{' '}
                                    <strong>
                                        {pageIndex + 1} of {pageOptions.length}
                                    </strong>{' '}
                                </span>
                                <span>
                                    | Go to page:{' '}
                                    <input
                                        type="number"
                                        defaultValue={pageIndex + 1}
                                        onChange={(e) => {
                                            const page = e.target.value ? Number(e.target.value) - 1 : 0;
                                            gotoPage(page);
                                        }}
                                        style={{ width: '100px' }}
                                    />
                                </span>{' '}
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                    }}
                                >
                                    {[10, 20, 30, 40, 50].map((pageSize) => (
                                        <option key={pageSize} value={pageSize}>
                                            Show {pageSize}
                                        </option>
                                    ))}
                                </select>
                                <div>
                                    Showing the first {page.length} results of {page.length} rows
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Wrapper>
        </>
    );
}
function EventDetails() {

    const [registrations, setRegistrations] = useState([])
    const {userDetails} = useGlobalContext()
    
    
    useEffect(() => {
        let body = {}
        if(userDetails.role === 'CORDINATOR'){
            // callApi('event/fetch_event_by_cordinator').then(res=>{
            //     if(res.type === 'success' && res.data.event){
                    
            //     }
            // }).catch(err=>{
            //     alert(err)
            // })
            body.eventId = userDetails?.eventId
            fetchEvents(body)
        }else{
            fetchEvents()
        }
        
    }, [])

    const fetchEvents = (body = {})=>{
        callApi('event/fetch_event_registrations', body ).then(res=>{
            if(res.type === 'success'){
                if(userDetails?.role === 'ADMIN'){
                    res.data.registrations.map(reg=>{
                        reg.event = reg.event.name
                        reg.registrations = reg.userId.length
                    })
                    setRegistrations(res.data.registrations)
                }else{
                    let obj = res.data.registrations.user.map(user=>{
                        return {
                            event : res.data.registrations.event.name,
                            username : user.name,
                            phone: user.phone
                        }
                    })
                    setRegistrations(obj)
                }
                
            }
        })
    }
    
    let columns;
    if(userDetails?.role === 'ADMIN'){
        columns = React.useMemo(
            () => [
                {
                    Header: ' ',
                    columns: [
                        {
                            Header: 'EVENT',
                            accessor: 'event',
                            filter: 'fuzzyText',
                        },
                        {
                            Header: 'Registrations',
                            accessor: 'registrations',
                            filter: 'fuzzyText',
                        },
                    ],
                },
            ],
            []
        );
    }else{
        columns = React.useMemo(
            () => [
                {
                    Header: ' ',
                    columns: [
                        {
                            Header: 'EVENT',
                            accessor: 'event',
                            filter: 'fuzzyText',
                        },
                        {
                            Header: 'Name',
                            accessor: 'username',
                            filter: 'fuzzyText',
                        },
                        {
                            Header: 'Phone',
                            accessor: 'phone',
                            filter: 'fuzzyText',
                        },
                    ],
                },
            ],
            []
        );
    }
    return <Table columns={columns} data={registrations} />;
}
const Wrapper = styled.section`
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;700&display=swap');
*,
*::before,
*::after {
margin: 0;
padding: 0;
box-sizing: border-box;
}
html {
font-size: 16px;
}
body {
font-size: 1rem;
background: #7f80db;
font-family: 'Quicksand', sans-serif;
color: #292929;
}
.container {
display: flex;
flex-flow: row nowrap;
justify-content: center;
align-items: center;
width: 100vw;
margin: 5rem auto;
}
.container h1 {
text-align: center;
text-transform: uppercase;
font-size: 4rem;
}
.pagination {
background: #fff;
padding: 1rem;
display: flex;
flex-flow: row nowrap;
justify-content: center;
}
table {
padding: 1rem;
width: 100%;
border-radius: 1rem;
border: 0.5rem solid #292929;
}
table th div {
font-size: 1.6rem;
background: #292929;
color: #ffffff;
}
table thead tr td {
width: 30rem;
}
table td {
background: #fff;
width: 30rem;
max-width: 30rem;
padding: 1rem;
border-bottom: 0.1rem solid #292929;
border-top: 0.1rem solid #292929;
}
input {
width: 100%;
height: 4rem;
padding: 1rem;
border: 0.1rem solid #292929;
margin-bottom: 1rem;
}
button {
background: #ffffff;
height: 2rem;
width: 2rem;
border: none;
cursor: pointer;
}
select {
height: 2rem;
width: 10rem;
}`;
export default EventDetails