export { setupMonacoWorkers } from './setup'
export type {
  MonacoBuiltinLanguage,
  MonacoLanguage,
  MonacoSqlLanguageId,
} from './languages'
export {
  ensureMongodbShellLanguage,
  MONACO_MONGODB_SHELL_LANGUAGE,
  MONACO_GENERIC_SQL_LANGUAGE,
  MONACO_MYSQL_LANGUAGE,
  MONACO_DAMENG_LANGUAGE,
  MONACO_KINGBASE_LANGUAGE,
  MONACO_PGSQL_LANGUAGE,
  MONACO_SQLITE_LANGUAGE,
} from './languages'
export {
  applyMonacoDebugDecorations,
  buildMonacoDebugDecorations,
  RS_MONACO_DEBUG,
} from './debug-decorations'
export type { MonacoDebugDecorationState } from './debug-decorations'
