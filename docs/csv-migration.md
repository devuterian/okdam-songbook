# CSV Migration

Supported legacy headers include:

- `곡명` -> `title`
- `번호` -> `tjNumber`
- `아티스트` -> `artist`
- `원작` -> `originalWork`
- `장르` -> `genres`
- `추천인` -> `createdByName` or `sourceReference`
- `키` -> `keyCandidates`

Ambiguous key values such as `-1?-2?` are not silently converted. The parser preserves the original value and emits a warning.

CSV import should run as dry-run first, then commit selected rows as one batch with a `clientRequestId`.

