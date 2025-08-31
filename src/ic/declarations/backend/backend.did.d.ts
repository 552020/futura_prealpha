import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AccessEvent = { 'CapsuleMaturity' : number } |
  { 'Graduation' : null } |
  { 'AfterDeath' : null } |
  { 'Wedding' : null } |
  { 'Birthday' : number } |
  { 'Custom' : string } |
  { 'ConnectionCount' : number } |
  { 'Anniversary' : number };
export interface AudioMetadata {
  'duration' : [] | [number],
  'base' : MemoryMetadataBase,
  'channels' : [] | [number],
  'sample_rate' : [] | [number],
  'bitrate' : [] | [number],
  'format' : [] | [string],
}
export interface BlobRef {
  'locator' : string,
  'hash' : [] | [Uint8Array | number[]],
  'kind' : MemoryBlobKind,
}
export interface Capsule {
  'id' : string,
  'updated_at' : bigint,
  'controllers' : Array<[PersonRef, ControllerState]>,
  'subject' : PersonRef,
  'owners' : Array<[PersonRef, OwnerState]>,
  'created_at' : bigint,
  'connection_groups' : Array<[string, ConnectionGroup]>,
  'connections' : Array<[PersonRef, Connection]>,
  'memories' : Array<[string, Memory]>,
  'bound_to_web2' : boolean,
  'galleries' : Array<[string, Gallery]>,
}
export interface CapsuleCreationResult {
  'capsule_id' : [] | [string],
  'message' : string,
  'success' : boolean,
}
export interface CapsuleHeader {
  'id' : string,
  'updated_at' : bigint,
  'subject' : PersonRef,
  'owner_count' : number,
  'created_at' : bigint,
  'controller_count' : number,
  'memory_count' : number,
}
export interface CapsuleInfo {
  'updated_at' : bigint,
  'subject' : PersonRef,
  'capsule_id' : string,
  'is_owner' : boolean,
  'created_at' : bigint,
  'bound_to_web2' : boolean,
  'is_self_capsule' : boolean,
  'is_controller' : boolean,
}
export interface CapsuleRegistrationResult {
  'capsule_id' : [] | [string],
  'is_new' : boolean,
  'message' : string,
  'success' : boolean,
}
export interface Connection {
  'status' : ConnectionStatus,
  'updated_at' : bigint,
  'peer' : PersonRef,
  'created_at' : bigint,
}
export interface ConnectionGroup {
  'id' : string,
  'updated_at' : bigint,
  'members' : Array<PersonRef>,
  'name' : string,
  'description' : [] | [string],
  'created_at' : bigint,
}
export type ConnectionStatus = { 'Blocked' : null } |
  { 'Accepted' : null } |
  { 'Revoked' : null } |
  { 'Pending' : null };
export interface ControllerState {
  'granted_at' : bigint,
  'granted_by' : PersonRef,
}
export type CreationStatus = { 'Importing' : null } |
  { 'Creating' : null } |
  { 'Failed' : null } |
  { 'Exporting' : null } |
  { 'Installing' : null } |
  { 'Completed' : null } |
  { 'Verifying' : null } |
  { 'NotStarted' : null };
export interface CreationStatusResponse {
  'status' : CreationStatus,
  'canister_id' : [] | [Principal],
  'message' : [] | [string],
}
export interface DeleteGalleryResponse {
  'message' : string,
  'success' : boolean,
}
export interface DetailedCreationStatus {
  'status' : CreationStatus,
  'progress_message' : string,
  'canister_id' : [] | [Principal],
  'error_message' : [] | [string],
  'created_at' : bigint,
  'cycles_consumed' : bigint,
  'completed_at' : [] | [bigint],
}
export interface DocumentMetadata { 'base' : MemoryMetadataBase }
export interface Gallery {
  'id' : string,
  'is_public' : boolean,
  'title' : string,
  'updated_at' : bigint,
  'memory_entries' : Array<GalleryMemoryEntry>,
  'description' : [] | [string],
  'created_at' : bigint,
  'storage_status' : GalleryStorageStatus,
  'owner_principal' : Principal,
}
export interface GalleryData {
  'owner_principal' : Principal,
  'gallery' : Gallery,
}
export interface GalleryMemoryEntry {
  'memory_id' : string,
  'is_featured' : boolean,
  'position' : number,
  'gallery_metadata' : string,
  'gallery_caption' : [] | [string],
}
export type GalleryStorageStatus = { 'Web2Only' : null } |
  { 'Failed' : null } |
  { 'Both' : null } |
  { 'Migrating' : null } |
  { 'ICPOnly' : null };
export interface GalleryUpdateData {
  'is_public' : [] | [boolean],
  'title' : [] | [string],
  'memory_entries' : [] | [Array<GalleryMemoryEntry>],
  'description' : [] | [string],
}
export interface ImageMetadata {
  'base' : MemoryMetadataBase,
  'dimensions' : [] | [[number, number]],
}
export interface Memory {
  'id' : string,
  'access' : MemoryAccess,
  'metadata' : MemoryMetadata,
  'data' : MemoryData,
  'info' : MemoryInfo,
}
export type MemoryAccess = { 'Private' : null } |
  {
    'Custom' : { 'groups' : Array<string>, 'individuals' : Array<PersonRef> }
  } |
  {
    'EventTriggered' : {
      'access' : MemoryAccess,
      'trigger_event' : AccessEvent,
    }
  } |
  { 'Public' : null } |
  { 'Scheduled' : { 'access' : MemoryAccess, 'accessible_after' : bigint } };
export type MemoryBlobKind = { 'MemoryBlobKindExternal' : null } |
  { 'ICPCapsule' : null };
export interface MemoryData {
  'data' : [] | [Uint8Array | number[]],
  'blob_ref' : BlobRef,
}
export interface MemoryInfo {
  'updated_at' : bigint,
  'date_of_memory' : [] | [bigint],
  'memory_type' : MemoryType,
  'name' : string,
  'content_type' : string,
  'created_at' : bigint,
  'uploaded_at' : bigint,
}
export interface MemoryListResponse {
  'memories' : Array<Memory>,
  'message' : string,
  'success' : boolean,
}
export type MemoryMetadata = { 'Note' : NoteMetadata } |
  { 'Image' : ImageMetadata } |
  { 'Document' : DocumentMetadata } |
  { 'Audio' : AudioMetadata } |
  { 'Video' : VideoMetadata };
export interface MemoryMetadataBase {
  'date_of_memory' : [] | [string],
  'size' : bigint,
  'people_in_memory' : [] | [Array<string>],
  'mime_type' : string,
  'original_name' : string,
  'uploaded_at' : string,
  'format' : [] | [string],
}
export interface MemoryOperationResponse {
  'memory_id' : [] | [string],
  'message' : string,
  'success' : boolean,
}
export type MemoryType = { 'Note' : null } |
  { 'Image' : null } |
  { 'Document' : null } |
  { 'Audio' : null } |
  { 'Video' : null };
export interface MemoryUpdateData {
  'access' : [] | [MemoryAccess],
  'metadata' : [] | [MemoryMetadata],
  'name' : [] | [string],
}
export interface NoteMetadata {
  'base' : MemoryMetadataBase,
  'tags' : [] | [Array<string>],
}
export interface OwnerState { 'last_activity_at' : bigint, 'since' : bigint }
export type PersonRef = { 'Opaque' : string } |
  { 'Principal' : Principal };
export interface PersonalCanisterCreationResponse {
  'canister_id' : [] | [Principal],
  'message' : string,
  'success' : boolean,
}
export interface PersonalCanisterCreationStats {
  'total_successes' : bigint,
  'total_failures' : bigint,
  'total_attempts' : bigint,
  'total_cycles_consumed' : bigint,
}
export type Result = { 'Ok' : boolean } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : Array<[Principal, DetailedCreationStatus]> } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : PersonalCanisterCreationStats } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : [] | [DetailedCreationStatus] } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : null } |
  { 'Err' : string };
export interface StoreGalleryResponse {
  'gallery_id' : [] | [string],
  'message' : string,
  'storage_status' : GalleryStorageStatus,
  'icp_gallery_id' : [] | [string],
  'success' : boolean,
}
export interface UpdateGalleryResponse {
  'message' : string,
  'success' : boolean,
  'gallery' : [] | [Gallery],
}
export interface VideoMetadata {
  'height' : [] | [number],
  'duration' : [] | [number],
  'thumbnail' : [] | [string],
  'base' : MemoryMetadataBase,
  'width' : [] | [number],
}
export interface _SERVICE {
  'add_admin' : ActorMethod<[Principal], boolean>,
  'add_memory_to_capsule' : ActorMethod<[MemoryData], MemoryOperationResponse>,
  'clear_creation_state' : ActorMethod<[Principal], Result>,
  'clear_migration_state' : ActorMethod<[Principal], Result>,
  'create_capsule' : ActorMethod<[PersonRef], CapsuleCreationResult>,
  'create_personal_canister' : ActorMethod<
    [],
    PersonalCanisterCreationResponse
  >,
  'delete_gallery' : ActorMethod<[string], DeleteGalleryResponse>,
  'delete_memory_from_capsule' : ActorMethod<[string], MemoryOperationResponse>,
  'get_api_version' : ActorMethod<[], string>,
  'get_capsule' : ActorMethod<[string], [] | [Capsule]>,
  'get_creation_states_by_status' : ActorMethod<[CreationStatus], Result_1>,
  'get_creation_status' : ActorMethod<[], [] | [CreationStatusResponse]>,
  'get_detailed_creation_status' : ActorMethod<
    [],
    [] | [DetailedCreationStatus]
  >,
  'get_detailed_migration_status' : ActorMethod<
    [],
    [] | [DetailedCreationStatus]
  >,
  'get_gallery_by_id' : ActorMethod<[string], [] | [Gallery]>,
  'get_memory_from_capsule' : ActorMethod<[string], [] | [Memory]>,
  'get_migration_states_by_status' : ActorMethod<[CreationStatus], Result_1>,
  'get_migration_stats' : ActorMethod<[], Result_2>,
  'get_migration_status' : ActorMethod<[], [] | [CreationStatusResponse]>,
  'get_my_galleries' : ActorMethod<[], Array<Gallery>>,
  'get_my_personal_canister_id' : ActorMethod<[], [] | [Principal]>,
  'get_personal_canister_creation_stats' : ActorMethod<[], Result_2>,
  'get_personal_canister_id' : ActorMethod<[Principal], [] | [Principal]>,
  'get_user' : ActorMethod<[], [] | [CapsuleInfo]>,
  'get_user_creation_status' : ActorMethod<[Principal], Result_3>,
  'get_user_galleries' : ActorMethod<[Principal], Array<Gallery>>,
  'get_user_migration_status' : ActorMethod<[Principal], Result_3>,
  'greet' : ActorMethod<[string], string>,
  'is_migration_enabled' : ActorMethod<[], boolean>,
  'is_personal_canister_creation_enabled' : ActorMethod<[], boolean>,
  'list_admins' : ActorMethod<[], Array<Principal>>,
  'list_all_creation_states' : ActorMethod<[], Result_1>,
  'list_all_migration_states' : ActorMethod<[], Result_1>,
  'list_capsule_memories' : ActorMethod<[], MemoryListResponse>,
  'list_my_capsules' : ActorMethod<[], Array<CapsuleHeader>>,
  'list_superadmins' : ActorMethod<[], Array<Principal>>,
  'list_users' : ActorMethod<[], Array<CapsuleHeader>>,
  'mark_bound' : ActorMethod<[], boolean>,
  'mark_capsule_bound_to_web2' : ActorMethod<[], boolean>,
  'migrate_capsule' : ActorMethod<[], PersonalCanisterCreationResponse>,
  'prove_nonce' : ActorMethod<[string], boolean>,
  'register' : ActorMethod<[], boolean>,
  'register_capsule' : ActorMethod<[], CapsuleRegistrationResult>,
  'register_with_nonce' : ActorMethod<[string], boolean>,
  'remove_admin' : ActorMethod<[Principal], boolean>,
  'set_migration_enabled' : ActorMethod<[boolean], Result_4>,
  'set_personal_canister_creation_enabled' : ActorMethod<[boolean], Result_4>,
  'store_gallery_forever' : ActorMethod<[GalleryData], StoreGalleryResponse>,
  'update_gallery' : ActorMethod<
    [string, GalleryUpdateData],
    UpdateGalleryResponse
  >,
  'update_memory_in_capsule' : ActorMethod<
    [string, MemoryUpdateData],
    MemoryOperationResponse
  >,
  'verify_nonce' : ActorMethod<[string], [] | [Principal]>,
  'whoami' : ActorMethod<[], Principal>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
