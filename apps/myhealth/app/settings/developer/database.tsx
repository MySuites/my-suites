import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { RaisedCard, HollowedCard, useUITheme, IconSymbol, useToast } from '@mysuite/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { getDb } from '../../../utils/db/database';

interface TableRow {
    [key: string]: any;
}

export default function DeveloperDatabaseScreen() {
    const theme = useUITheme();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();

    const [tables, setTables] = useState<string[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [rows, setRows] = useState<TableRow[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [expandedRowIndex, setExpandedRowIndex] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Custom SQL Query state
    const [sqlQuery, setSqlQuery] = useState('');
    const [queryResult, setQueryResult] = useState<{ columns: string[], rows: TableRow[] } | null>(null);
    const [queryError, setQueryError] = useState<string | null>(null);
    const [isExecutingQuery, setIsExecutingQuery] = useState(false);

    const loadTableData = useCallback(async (tableName: string) => {
        setIsLoading(true);
        setExpandedRowIndex(null);
        setQueryResult(null);
        setQueryError(null);
        try {
            const db = await getDb();
            const result = await db.getAllAsync<TableRow>(`SELECT * FROM ${tableName} LIMIT 100;`);
            setRows(result);
            if (result.length > 0) {
                setColumns(Object.keys(result[0]));
            } else {
                // Get columns even if table is empty using pragma
                const info = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${tableName});`);
                setColumns(info.map(c => c.name));
            }
        } catch (e) {
            console.error(`Failed to load data for ${tableName}:`, e);
            showToast({ message: `Failed to load data for ${tableName}`, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [showToast]);

    const loadTables = useCallback(async () => {
        setIsLoading(true);
        try {
            const db = await getDb();
            const result = await db.getAllAsync<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
            );
            const tableNames = result.map(r => r.name);
            setTables(tableNames);
            if (tableNames.length > 0) {
                setSelectedTable(tableNames[0]);
                await loadTableData(tableNames[0]);
            } else {
                setIsLoading(false);
            }
        } catch (e) {
            console.error("Failed to load tables:", e);
            showToast({ message: "Failed to load database tables", type: 'error' });
            setIsLoading(false);
        }
    }, [loadTableData, showToast]);

    useEffect(() => {
        loadTables();
    }, [loadTables]);

    const handleExecuteQuery = async () => {
        if (!sqlQuery.trim()) return;
        setIsExecutingQuery(true);
        setQueryError(null);
        setQueryResult(null);
        try {
            const db = await getDb();
            const cleanQuery = sqlQuery.trim();
            
            if (cleanQuery.toLowerCase().startsWith('select')) {
                const result = await db.getAllAsync<TableRow>(cleanQuery);
                if (result.length > 0) {
                    setQueryResult({
                        columns: Object.keys(result[0]),
                        rows: result
                    });
                } else {
                    setQueryResult({
                        columns: [],
                        rows: []
                    });
                }
                showToast({ message: "Query executed successfully", type: 'success' });
            } else {
                // Run write query (update, insert, delete, etc.)
                const result = await db.runAsync(cleanQuery);
                showToast({ message: `Success. Affected rows: ${result.changes}`, type: 'success' });
                // Reload current table to show changes
                if (selectedTable) {
                    loadTableData(selectedTable);
                }
            }
        } catch (e: any) {
            console.error("SQL execution error:", e);
            setQueryError(e.message || String(e));
        } finally {
            setIsExecutingQuery(false);
        }
    };

    const renderJsonValue = (val: any) => {
        if (val === null) return <Text className="text-gray-400">NULL</Text>;
        if (typeof val === 'object') return <Text className="text-blue-500 font-mono text-xs">{JSON.stringify(val)}</Text>;
        if (typeof val === 'boolean') return <Text className="text-purple-500 font-bold">{val ? "TRUE" : "FALSE"}</Text>;
        if (typeof val === 'number') return <Text className="text-green-600 dark:text-green-400 font-mono">{val}</Text>;
        return <Text className="text-light dark:text-dark font-medium">{String(val)}</Text>;
    };

    return (
        <View className="flex-1 bg-light dark:bg-dark">
            <ScreenHeader
                title="SQLite Database Viewer"
                leftAction={
                    <RaisedCard
                        onPress={() => router.back()}
                        className="w-12 p-0 rounded-full items-center justify-center bg-lighter dark:bg-dark"
                        style={{ borderRadius: 9999 }}
                    >
                        <IconSymbol name="chevron.left" size={24} color={theme.primary} />
                    </RaisedCard>
                }
            />

            <View style={{ flex: 1, paddingTop: insets.top + 80 }}>
                {/* Horizontal Table Tabs */}
                <View className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-dark-light py-2">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                        {tables.map(table => {
                            const isSelected = selectedTable === table && !queryResult && !queryError;
                            return (
                                <TouchableOpacity
                                    key={table}
                                    onPress={() => {
                                        setSelectedTable(table);
                                        loadTableData(table);
                                    }}
                                    style={{
                                        backgroundColor: isSelected ? theme.primary : (theme.bgLight || '#eaeaea'),
                                        paddingHorizontal: 14,
                                        paddingVertical: 8,
                                        borderRadius: 20
                                    }}
                                >
                                    <Text style={{ color: isSelected ? '#fff' : theme.text, fontWeight: '700', fontSize: 13 }}>
                                        {table}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
                    {/* SQL Console Console */}
                    <HollowedCard className="p-4 mb-6" style={{ borderRadius: 16 }}>
                        <Text className="text-sm font-bold text-light dark:text-dark mb-2">SQL Query Terminal</Text>
                        <TextInput
                            placeholder="e.g. SELECT * FROM set_logs ORDER BY id DESC LIMIT 5"
                            placeholderTextColor={theme.textMuted}
                            value={sqlQuery}
                            onChangeText={setSqlQuery}
                            multiline
                            className="bg-gray-100 dark:bg-dark-light p-3 rounded-xl text-light dark:text-dark text-xs min-h-[60px] font-mono mb-3"
                            style={{ textAlignVertical: 'top' }}
                        />
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleExecuteQuery}
                                disabled={isExecutingQuery || !sqlQuery.trim()}
                                style={{
                                    backgroundColor: sqlQuery.trim() ? theme.primary : '#eaeaea',
                                    borderRadius: 12,
                                    paddingVertical: 10,
                                    flex: 1,
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {isExecutingQuery ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={{ color: sqlQuery.trim() ? '#fff' : theme.textMuted, fontWeight: '700', fontSize: 13 }}>
                                        Run Query
                                    </Text>
                                )}
                            </TouchableOpacity>
                            {sqlQuery.trim() ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSqlQuery('');
                                        setQueryResult(null);
                                        setQueryError(null);
                                    }}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: theme.border || '#ccc',
                                        borderRadius: 12,
                                        paddingHorizontal: 16,
                                        justifyContent: 'center'
                                    }}
                                >
                                    <Text style={{ color: theme.text, fontWeight: '600', fontSize: 13 }}>Clear</Text>
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </HollowedCard>

                    {/* Query Error / Result Display */}
                    {queryError && (
                        <View className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 p-4 rounded-2xl mb-6">
                            <Text className="text-red-700 dark:text-red-400 font-bold text-sm mb-1">SQL Error</Text>
                            <Text className="text-red-600 dark:text-red-400 font-mono text-xs">{queryError}</Text>
                        </View>
                    )}

                    {queryResult && (
                        <View className="mb-6">
                            <Text className="text-sm font-bold text-light dark:text-dark mb-2">Query Output ({queryResult.rows.length} rows)</Text>
                            {queryResult.rows.length === 0 ? (
                                <HollowedCard className="p-4 items-center">
                                    <Text className="text-light-muted dark:text-dark-muted text-xs font-semibold">Empty Result Set</Text>
                                </HollowedCard>
                            ) : (
                                queryResult.rows.map((row, idx) => (
                                    <RaisedCard key={idx} className="p-3 mb-2" style={{ borderRadius: 12 }}>
                                        <Text className="text-xs font-bold text-primary mb-2">Row #{idx + 1}</Text>
                                        {queryResult.columns.map(col => (
                                            <View key={col} className="flex-row py-1 border-b border-gray-100 dark:border-gray-900 justify-between">
                                                <Text className="text-xs text-gray-500 font-mono font-semibold" style={{ width: '40%' }}>{col}</Text>
                                                <View style={{ width: '60%', alignItems: 'flex-end' }}>
                                                    {renderJsonValue(row[col])}
                                                </View>
                                            </View>
                                        ))}
                                    </RaisedCard>
                                ))
                            )}
                        </View>
                    )}

                    {/* Standard Table View */}
                    {!queryResult && !queryError && (
                        <View>
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-sm font-bold text-light dark:text-dark">
                                    Table: {selectedTable} ({rows.length} rows)
                                </Text>
                                <TouchableOpacity onPress={() => loadTableData(selectedTable)}>
                                    <IconSymbol name="arrow.counterclockwise" size={16} color={theme.primary} />
                                </TouchableOpacity>
                            </View>

                            {isLoading ? (
                                <ActivityIndicator size="large" color={theme.primary} className="my-10" />
                            ) : rows.length === 0 ? (
                                <HollowedCard className="p-10 items-center justify-center" style={{ borderRadius: 16 }}>
                                    <Text className="text-light-muted dark:text-dark-muted font-bold text-sm">Table is empty</Text>
                                </HollowedCard>
                            ) : (
                                rows.map((row, index) => {
                                    const isExpanded = expandedRowIndex === index;
                                    // Use ID or primary key if available, otherwise index
                                    const rowLabel = row.id || row.name || `Row #${index + 1}`;
                                    
                                    return (
                                        <RaisedCard
                                            key={index}
                                            className="p-4 mb-3"
                                            style={{ borderRadius: 16 }}
                                        >
                                            <TouchableOpacity
                                                onPress={() => setExpandedRowIndex(isExpanded ? null : index)}
                                                className="flex-row justify-between items-center"
                                            >
                                                <View style={{ flex: 1, marginRight: 12 }}>
                                                    <Text className="text-xs font-bold text-light dark:text-dark font-mono" numberOfLines={1}>
                                                        {rowLabel}
                                                    </Text>
                                                    {!isExpanded && row.created_at && (
                                                        <Text className="text-[10px] text-gray-400 mt-0.5">
                                                            Created: {row.created_at}
                                                        </Text>
                                                    )}
                                                </View>
                                                <IconSymbol
                                                    name={isExpanded ? "chevron.up" : "chevron.down"}
                                                    size={16}
                                                    color={theme.textMuted}
                                                />
                                            </TouchableOpacity>

                                            {isExpanded && (
                                                <View className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-900">
                                                    {columns.map(col => (
                                                        <View key={col} className="py-2 border-b border-gray-50 dark:border-gray-900">
                                                            <Text className="text-[10px] text-gray-400 font-mono font-bold uppercase mb-0.5">
                                                                {col}
                                                            </Text>
                                                            <View className="pl-1">
                                                                {renderJsonValue(row[col])}
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                        </RaisedCard>
                                    );
                                })
                            )}
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}
