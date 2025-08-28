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
export interface DocumentMetadata { 'base' : MemoryMetadataBase }
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
export type MemoryType = { 'Note' : null } |
  { 'Image' : null } |
  { 'Document' : null } |
  { 'Audio' : null } |
  { 'Video' : null };
export interface NoteMetadata {
  'base' : MemoryMetadataBase,
  'tags' : [] | [Array<string>],
}
export interface OwnerState { 'last_activity_at' : bigint, 'since' : bigint }
export type PersonRef = { 'Opaque' : string } |
  { 'Principal' : Principal };
export interface VideoMetadata {
  'height' : [] | [number],
  'duration' : [] | [number],
  'thumbnail' : [] | [string],
  'base' : MemoryMetadataBase,
  'width' : [] | [number],
}
export interface _SERVICE {
  'add_admin' : ActorMethod<[Principal], boolean>,
  'create_capsule' : ActorMethod<[PersonRef], CapsuleCreationResult>,
  'get_capsule' : ActorMethod<[string], [] | [Capsule]>,
  'get_user' : ActorMethod<[], [] | [CapsuleInfo]>,
  'get_user_by_principal' : ActorMethod<[Principal], [] | [CapsuleInfo]>,
  'greet' : ActorMethod<[string], string>,
  'list_admins' : ActorMethod<[], Array<Principal>>,
  'list_my_capsules' : ActorMethod<[], Array<CapsuleHeader>>,
  'list_superadmins' : ActorMethod<[], Array<Principal>>,
  'list_users' : ActorMethod<[], Array<CapsuleHeader>>,
  'mark_bound' : ActorMethod<[], boolean>,
  'mark_capsule_bound_to_web2' : ActorMethod<[], boolean>,
  'prove_nonce' : ActorMethod<[string], boolean>,
  'register' : ActorMethod<[], CapsuleRegistrationResult>,
  'register_capsule' : ActorMethod<[], CapsuleRegistrationResult>,
  'register_with_nonce' : ActorMethod<[string], boolean>,
  'remove_admin' : ActorMethod<[Principal], boolean>,
  'user_stats' : ActorMethod<[], Array<[string, bigint]>>,
  'verify_nonce' : ActorMethod<[string], [] | [Principal]>,
  'whoami' : ActorMethod<[], Principal>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
