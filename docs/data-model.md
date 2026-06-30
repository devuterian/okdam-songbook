# Data Model

## Songs

`id`, `tjNumber`, `title`, `titleReadingKo`, `titleRomanized`, `titleAliasesJson`, `artist`, `artistReadingKo`, `artistAliasesJson`, `country`, `genresJson`, `originalWork`, `keyCandidatesJson`, `memo`, `status`, `youtubeUrl`, `youtubeVideoId`, `isOfficialTjVideo`, `sourceType`, `sourceReference`, `createdByEmail`, `createdByName`, `createdAt`, `updatedByEmail`, `updatedByName`, `updatedAt`, `deletedAt`, `deletedByEmail`, `version`.

Public statuses: `active`, `favorite`, `practicing`, `hold`.

Hidden from public list: `deletion_candidate`, `deleted`.

## Performances

`id`, `songId`, `performedAt`, `keySelectionJson`, `memo`, `createdByEmail`, `createdByName`, `createdAt`, `cancelledAt`, `cancelledByEmail`, `clientRequestId`, `version`.

## ChangeLog

`id`, `entityType`, `entityId`, `action`, `beforeJson`, `afterJson`, `actorEmail`, `actorName`, `actorRole`, `createdAt`, `clientRequestId`, `entityVersionBefore`, `entityVersionAfter`.

