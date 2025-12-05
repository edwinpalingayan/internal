// =================================================================================================
// 行のソート処理
// =================================================================================================
// 変更履歴
// 2024-09-02 H.Miyashita 新規作成
// =================================================================================================
/** ------------------------------------------------------------------------------------------------
 * 行のソート
 * @param   {Array}   rows           ソート前の行データ
 * @param   {number}  sortLabelClick ソート対象のカラムのラベルがクリックされた回数
 * @param   {string}  sortCol        ソート対象のカラム名
 * @param   {string}  sortDir        ソートの方向（昇順：asc、降順：desc）
 * @returns {Array}                  ソート後の行データ
 *
 * ※sortメソッドのリターン
 *   -1 : currentをnextの前にする
 *    1 : nextをcurrentの前にする
 *    0 : 順番の変更無し
 */ //------------------------------------------------------------------------------------------------
interface Row {
  [key: string]: string | number | boolean | null | undefined;
}

export const sortRows = (
  rows: Row[],
  sortLabelClick: number,
  sortCol: string,
  sortDir: 'asc' | 'desc',
): Row[] => {
  return rows.sort((current: Row, next: Row) => {
    if (sortLabelClick) {
      const currentValue = current[sortCol] ?? '';
      const nextValue = next[sortCol] ?? '';
      const comp = currentValue > nextValue ? 1 : currentValue < nextValue ? -1 : 0;
      return sortDir === 'asc' ? comp : -comp;
    }
    return 0;
  });
};
