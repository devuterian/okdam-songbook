# Data Model

## Songs

`id`, `tjNumber`, `title`, `titleReadingKo`, `titleRomanized`, `titleAliasesJson`, `artist`, `artistReadingKo`, `artistAliasesJson`, `country`, `genresJson`, `originalWork`, `keyCandidatesJson`, `performerIdsJson`, `memo`, `status`, `youtubeUrl`, `youtubeVideoId`, `isOfficialTjVideo`, `sourceType`, `sourceReference`, `createdByEmail`, `createdByName`, `createdAt`, `updatedByEmail`, `updatedByName`, `updatedAt`, `deletedAt`, `deletedByEmail`, `version`.

`performerIdsJson` stores structured singer assignments as user IDs, not display names. Built-in IDs are `marie`, `seongwook`, and `yeowool`; legacy `뽀냐` input migrates to `["marie", "yeowool"]`.

Public statuses: `active`, `favorite`, `practicing`, `hold`.

Hidden from public list: `deletion_candidate`, `deleted`.

## Performances

`id`, `songId`, `performedAt`, `keySelectionJson`, `memo`, `createdByEmail`, `createdByName`, `createdAt`, `cancelledAt`, `cancelledByEmail`, `clientRequestId`, `version`.

## ChangeLog

`id`, `entityType`, `entityId`, `action`, `beforeJson`, `afterJson`, `actorEmail`, `actorName`, `actorRole`, `createdAt`, `clientRequestId`, `entityVersionBefore`, `entityVersionAfter`.
