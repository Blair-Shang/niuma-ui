/** Monaco 内置语言与扩展方言 ID。后续 SQL / YAML 方言在 languages/ 下新增并在此登记。 */
export type MonacoBuiltinLanguage =
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'sql'
  | 'yaml'
  | 'plaintext'

/** SQL 方言 languageId（业务侧注册：Worker 或 Bridge LSP）。
 * 新增方言时在此扩展；Worker 方言另在 setupMonacoWorkers 挂对应 worker。
 */
export type MonacoSqlLanguageId =
  | 'pgsql'
  | 'mysql'
  | 'genericsql'
  | 'dameng'
  | 'kingbase'
  | 'clickhouse'
  | 'sqlite'
  | 'sqlserver'
  | 'oracle'

/** 编辑器 language prop 可传入的全部语言 ID。 */
export type MonacoLanguage = MonacoBuiltinLanguage | 'mongodb-shell' | MonacoSqlLanguageId

/** Vastbase / PostgreSQL 在 Monaco 中的 languageId（与 LanguageIdEnum.PG 一致）。 */
export const MONACO_PGSQL_LANGUAGE = 'pgsql' as const

/** MySQL 在 Monaco 中的 languageId（与 LanguageIdEnum.MYSQL 一致）。 */
export const MONACO_MYSQL_LANGUAGE = 'mysql' as const

/** Dameng 在 Monaco 中的 languageId（Bridge LSP）。 */
export const MONACO_DAMENG_LANGUAGE = 'dameng' as const

/** Kingbase 在 Monaco 中的 languageId（Bridge LSP）。 */
export const MONACO_KINGBASE_LANGUAGE = 'kingbase' as const

/** ClickHouse 在 Monaco 中的 languageId（Bridge LSP）。 */
export const MONACO_CLICKHOUSE_LANGUAGE = 'clickhouse' as const

/** SQLite 在 Monaco 中的 languageId（Bridge LSP）。 */
export const MONACO_SQLITE_LSP_LANGUAGE = 'sqlite' as const

/** SQL Server 在 Monaco 中的 languageId（Bridge LSP）。 */
export const MONACO_SQLSERVER_LANGUAGE = 'sqlserver' as const

/** Oracle 在 Monaco 中的 languageId（Bridge LSP）。 */
export const MONACO_ORACLE_LANGUAGE = 'oracle' as const

/** Generic SQL / 旧 Worker 在 Monaco 中的 languageId（与 LanguageIdEnum.GENERIC 一致）。 */
export const MONACO_GENERIC_SQL_LANGUAGE = 'genericsql' as const

/** @deprecated 使用 MONACO_GENERIC_SQL_LANGUAGE；Wire ID 同为 genericsql */
export const MONACO_SQLITE_LANGUAGE = MONACO_GENERIC_SQL_LANGUAGE
