/** UTM query builder options (values validated against constants at call sites). */
export interface UtmBuildOptions {
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
}
