export const idlFactory = ({ IDL }) => {
  const MemoryAccess = IDL.Rec();
  const MemoryBlobKind = IDL.Variant({
    'MemoryBlobKindExternal' : IDL.Null,
    'ICPCapsule' : IDL.Null,
  });
  const BlobRef = IDL.Record({
    'locator' : IDL.Text,
    'hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'kind' : MemoryBlobKind,
  });
  const MemoryData = IDL.Record({
    'data' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'blob_ref' : BlobRef,
  });
  const MemoryOperationResponse = IDL.Record({
    'memory_id' : IDL.Opt(IDL.Text),
    'message' : IDL.Text,
    'success' : IDL.Bool,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Bool, 'Err' : IDL.Text });
  const PersonRef = IDL.Variant({
    'Opaque' : IDL.Text,
    'Principal' : IDL.Principal,
  });
  const CapsuleCreationResult = IDL.Record({
    'capsule_id' : IDL.Opt(IDL.Text),
    'message' : IDL.Text,
    'success' : IDL.Bool,
  });
  const PersonalCanisterCreationResponse = IDL.Record({
    'canister_id' : IDL.Opt(IDL.Principal),
    'message' : IDL.Text,
    'success' : IDL.Bool,
  });
  const DeleteGalleryResponse = IDL.Record({
    'message' : IDL.Text,
    'success' : IDL.Bool,
  });
  const ControllerState = IDL.Record({
    'granted_at' : IDL.Nat64,
    'granted_by' : PersonRef,
  });
  const OwnerState = IDL.Record({
    'last_activity_at' : IDL.Nat64,
    'since' : IDL.Nat64,
  });
  const ConnectionGroup = IDL.Record({
    'id' : IDL.Text,
    'updated_at' : IDL.Nat64,
    'members' : IDL.Vec(PersonRef),
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
    'created_at' : IDL.Nat64,
  });
  const ConnectionStatus = IDL.Variant({
    'Blocked' : IDL.Null,
    'Accepted' : IDL.Null,
    'Revoked' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Connection = IDL.Record({
    'status' : ConnectionStatus,
    'updated_at' : IDL.Nat64,
    'peer' : PersonRef,
    'created_at' : IDL.Nat64,
  });
  const AccessEvent = IDL.Variant({
    'CapsuleMaturity' : IDL.Nat32,
    'Graduation' : IDL.Null,
    'AfterDeath' : IDL.Null,
    'Wedding' : IDL.Null,
    'Birthday' : IDL.Nat32,
    'Custom' : IDL.Text,
    'ConnectionCount' : IDL.Nat32,
    'Anniversary' : IDL.Nat32,
  });
  MemoryAccess.fill(
    IDL.Variant({
      'Private' : IDL.Null,
      'Custom' : IDL.Record({
        'groups' : IDL.Vec(IDL.Text),
        'individuals' : IDL.Vec(PersonRef),
      }),
      'EventTriggered' : IDL.Record({
        'access' : MemoryAccess,
        'trigger_event' : AccessEvent,
      }),
      'Public' : IDL.Null,
      'Scheduled' : IDL.Record({
        'access' : MemoryAccess,
        'accessible_after' : IDL.Nat64,
      }),
    })
  );
  const MemoryMetadataBase = IDL.Record({
    'date_of_memory' : IDL.Opt(IDL.Text),
    'size' : IDL.Nat64,
    'people_in_memory' : IDL.Opt(IDL.Vec(IDL.Text)),
    'mime_type' : IDL.Text,
    'original_name' : IDL.Text,
    'uploaded_at' : IDL.Text,
    'format' : IDL.Opt(IDL.Text),
  });
  const NoteMetadata = IDL.Record({
    'base' : MemoryMetadataBase,
    'tags' : IDL.Opt(IDL.Vec(IDL.Text)),
  });
  const ImageMetadata = IDL.Record({
    'base' : MemoryMetadataBase,
    'dimensions' : IDL.Opt(IDL.Tuple(IDL.Nat32, IDL.Nat32)),
  });
  const DocumentMetadata = IDL.Record({ 'base' : MemoryMetadataBase });
  const AudioMetadata = IDL.Record({
    'duration' : IDL.Opt(IDL.Nat32),
    'base' : MemoryMetadataBase,
    'channels' : IDL.Opt(IDL.Nat8),
    'sample_rate' : IDL.Opt(IDL.Nat32),
    'bitrate' : IDL.Opt(IDL.Nat32),
    'format' : IDL.Opt(IDL.Text),
  });
  const VideoMetadata = IDL.Record({
    'height' : IDL.Opt(IDL.Nat32),
    'duration' : IDL.Opt(IDL.Nat32),
    'thumbnail' : IDL.Opt(IDL.Text),
    'base' : MemoryMetadataBase,
    'width' : IDL.Opt(IDL.Nat32),
  });
  const MemoryMetadata = IDL.Variant({
    'Note' : NoteMetadata,
    'Image' : ImageMetadata,
    'Document' : DocumentMetadata,
    'Audio' : AudioMetadata,
    'Video' : VideoMetadata,
  });
  const MemoryType = IDL.Variant({
    'Note' : IDL.Null,
    'Image' : IDL.Null,
    'Document' : IDL.Null,
    'Audio' : IDL.Null,
    'Video' : IDL.Null,
  });
  const MemoryInfo = IDL.Record({
    'updated_at' : IDL.Nat64,
    'date_of_memory' : IDL.Opt(IDL.Nat64),
    'memory_type' : MemoryType,
    'name' : IDL.Text,
    'content_type' : IDL.Text,
    'created_at' : IDL.Nat64,
    'uploaded_at' : IDL.Nat64,
  });
  const Memory = IDL.Record({
    'id' : IDL.Text,
    'access' : MemoryAccess,
    'metadata' : MemoryMetadata,
    'data' : MemoryData,
    'info' : MemoryInfo,
  });
  const GalleryMemoryEntry = IDL.Record({
    'memory_id' : IDL.Text,
    'is_featured' : IDL.Bool,
    'position' : IDL.Nat32,
    'gallery_metadata' : IDL.Text,
    'gallery_caption' : IDL.Opt(IDL.Text),
  });
  const GalleryStorageStatus = IDL.Variant({
    'Web2Only' : IDL.Null,
    'Failed' : IDL.Null,
    'Both' : IDL.Null,
    'Migrating' : IDL.Null,
    'ICPOnly' : IDL.Null,
  });
  const Gallery = IDL.Record({
    'id' : IDL.Text,
    'is_public' : IDL.Bool,
    'title' : IDL.Text,
    'updated_at' : IDL.Nat64,
    'memory_entries' : IDL.Vec(GalleryMemoryEntry),
    'description' : IDL.Opt(IDL.Text),
    'created_at' : IDL.Nat64,
    'storage_status' : GalleryStorageStatus,
    'owner_principal' : IDL.Principal,
  });
  const Capsule = IDL.Record({
    'id' : IDL.Text,
    'updated_at' : IDL.Nat64,
    'controllers' : IDL.Vec(IDL.Tuple(PersonRef, ControllerState)),
    'subject' : PersonRef,
    'owners' : IDL.Vec(IDL.Tuple(PersonRef, OwnerState)),
    'created_at' : IDL.Nat64,
    'connection_groups' : IDL.Vec(IDL.Tuple(IDL.Text, ConnectionGroup)),
    'connections' : IDL.Vec(IDL.Tuple(PersonRef, Connection)),
    'memories' : IDL.Vec(IDL.Tuple(IDL.Text, Memory)),
    'bound_to_web2' : IDL.Bool,
    'galleries' : IDL.Vec(IDL.Tuple(IDL.Text, Gallery)),
  });
  const CreationStatus = IDL.Variant({
    'Importing' : IDL.Null,
    'Creating' : IDL.Null,
    'Failed' : IDL.Null,
    'Exporting' : IDL.Null,
    'Installing' : IDL.Null,
    'Completed' : IDL.Null,
    'Verifying' : IDL.Null,
    'NotStarted' : IDL.Null,
  });
  const DetailedCreationStatus = IDL.Record({
    'status' : CreationStatus,
    'progress_message' : IDL.Text,
    'canister_id' : IDL.Opt(IDL.Principal),
    'error_message' : IDL.Opt(IDL.Text),
    'created_at' : IDL.Nat64,
    'cycles_consumed' : IDL.Nat,
    'completed_at' : IDL.Opt(IDL.Nat64),
  });
  const Result_1 = IDL.Variant({
    'Ok' : IDL.Vec(IDL.Tuple(IDL.Principal, DetailedCreationStatus)),
    'Err' : IDL.Text,
  });
  const CreationStatusResponse = IDL.Record({
    'status' : CreationStatus,
    'canister_id' : IDL.Opt(IDL.Principal),
    'message' : IDL.Opt(IDL.Text),
  });
  const PersonalCanisterCreationStats = IDL.Record({
    'total_successes' : IDL.Nat64,
    'total_failures' : IDL.Nat64,
    'total_attempts' : IDL.Nat64,
    'total_cycles_consumed' : IDL.Nat,
  });
  const Result_2 = IDL.Variant({
    'Ok' : PersonalCanisterCreationStats,
    'Err' : IDL.Text,
  });
  const CapsuleInfo = IDL.Record({
    'updated_at' : IDL.Nat64,
    'subject' : PersonRef,
    'capsule_id' : IDL.Text,
    'is_owner' : IDL.Bool,
    'created_at' : IDL.Nat64,
    'bound_to_web2' : IDL.Bool,
    'is_self_capsule' : IDL.Bool,
    'is_controller' : IDL.Bool,
  });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Opt(DetailedCreationStatus),
    'Err' : IDL.Text,
  });
  const MemoryListResponse = IDL.Record({
    'memories' : IDL.Vec(Memory),
    'message' : IDL.Text,
    'success' : IDL.Bool,
  });
  const CapsuleHeader = IDL.Record({
    'id' : IDL.Text,
    'updated_at' : IDL.Nat64,
    'subject' : PersonRef,
    'owner_count' : IDL.Nat32,
    'created_at' : IDL.Nat64,
    'controller_count' : IDL.Nat32,
    'memory_count' : IDL.Nat32,
  });
  const CapsuleRegistrationResult = IDL.Record({
    'capsule_id' : IDL.Opt(IDL.Text),
    'is_new' : IDL.Bool,
    'message' : IDL.Text,
    'success' : IDL.Bool,
  });
  const Result_4 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text });
  const GalleryData = IDL.Record({
    'owner_principal' : IDL.Principal,
    'gallery' : Gallery,
  });
  const StoreGalleryResponse = IDL.Record({
    'gallery_id' : IDL.Opt(IDL.Text),
    'message' : IDL.Text,
    'storage_status' : GalleryStorageStatus,
    'icp_gallery_id' : IDL.Opt(IDL.Text),
    'success' : IDL.Bool,
  });
  const GalleryUpdateData = IDL.Record({
    'is_public' : IDL.Opt(IDL.Bool),
    'title' : IDL.Opt(IDL.Text),
    'memory_entries' : IDL.Opt(IDL.Vec(GalleryMemoryEntry)),
    'description' : IDL.Opt(IDL.Text),
  });
  const UpdateGalleryResponse = IDL.Record({
    'message' : IDL.Text,
    'success' : IDL.Bool,
    'gallery' : IDL.Opt(Gallery),
  });
  const MemoryUpdateData = IDL.Record({
    'access' : IDL.Opt(MemoryAccess),
    'metadata' : IDL.Opt(MemoryMetadata),
    'data' : IDL.Opt(MemoryData),
    'info' : IDL.Opt(MemoryInfo),
  });
  return IDL.Service({
    'add_admin' : IDL.Func([IDL.Principal], [IDL.Bool], []),
    'add_memory_to_capsule' : IDL.Func(
        [MemoryData],
        [MemoryOperationResponse],
        [],
      ),
    'clear_creation_state' : IDL.Func([IDL.Principal], [Result], []),
    'clear_migration_state' : IDL.Func([IDL.Principal], [Result], []),
    'create_capsule' : IDL.Func([PersonRef], [CapsuleCreationResult], []),
    'create_personal_canister' : IDL.Func(
        [],
        [PersonalCanisterCreationResponse],
        [],
      ),
    'delete_gallery' : IDL.Func([IDL.Text], [DeleteGalleryResponse], []),
    'delete_memory_from_capsule' : IDL.Func(
        [IDL.Text],
        [MemoryOperationResponse],
        [],
      ),
    'get_api_version' : IDL.Func([], [IDL.Text], ['query']),
    'get_capsule' : IDL.Func([IDL.Text], [IDL.Opt(Capsule)], ['query']),
    'get_creation_states_by_status' : IDL.Func(
        [CreationStatus],
        [Result_1],
        ['query'],
      ),
    'get_creation_status' : IDL.Func(
        [],
        [IDL.Opt(CreationStatusResponse)],
        ['query'],
      ),
    'get_detailed_creation_status' : IDL.Func(
        [],
        [IDL.Opt(DetailedCreationStatus)],
        ['query'],
      ),
    'get_detailed_migration_status' : IDL.Func(
        [],
        [IDL.Opt(DetailedCreationStatus)],
        ['query'],
      ),
    'get_gallery_by_id' : IDL.Func([IDL.Text], [IDL.Opt(Gallery)], ['query']),
    'get_memory_from_capsule' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(Memory)],
        ['query'],
      ),
    'get_migration_states_by_status' : IDL.Func(
        [CreationStatus],
        [Result_1],
        ['query'],
      ),
    'get_migration_stats' : IDL.Func([], [Result_2], ['query']),
    'get_migration_status' : IDL.Func(
        [],
        [IDL.Opt(CreationStatusResponse)],
        ['query'],
      ),
    'get_my_galleries' : IDL.Func([], [IDL.Vec(Gallery)], ['query']),
    'get_my_personal_canister_id' : IDL.Func(
        [],
        [IDL.Opt(IDL.Principal)],
        ['query'],
      ),
    'get_personal_canister_creation_stats' : IDL.Func(
        [],
        [Result_2],
        ['query'],
      ),
    'get_personal_canister_id' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(IDL.Principal)],
        ['query'],
      ),
    'get_user' : IDL.Func([], [IDL.Opt(CapsuleInfo)], ['query']),
    'get_user_creation_status' : IDL.Func(
        [IDL.Principal],
        [Result_3],
        ['query'],
      ),
    'get_user_galleries' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(Gallery)],
        ['query'],
      ),
    'get_user_migration_status' : IDL.Func(
        [IDL.Principal],
        [Result_3],
        ['query'],
      ),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'is_migration_enabled' : IDL.Func([], [IDL.Bool], ['query']),
    'is_personal_canister_creation_enabled' : IDL.Func(
        [],
        [IDL.Bool],
        ['query'],
      ),
    'list_admins' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'list_all_creation_states' : IDL.Func([], [Result_1], ['query']),
    'list_all_migration_states' : IDL.Func([], [Result_1], ['query']),
    'list_capsule_memories' : IDL.Func([], [MemoryListResponse], ['query']),
    'list_my_capsules' : IDL.Func([], [IDL.Vec(CapsuleHeader)], ['query']),
    'list_superadmins' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'list_users' : IDL.Func([], [IDL.Vec(CapsuleHeader)], ['query']),
    'mark_bound' : IDL.Func([], [IDL.Bool], []),
    'mark_capsule_bound_to_web2' : IDL.Func([], [IDL.Bool], []),
    'migrate_capsule' : IDL.Func([], [PersonalCanisterCreationResponse], []),
    'prove_nonce' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'register' : IDL.Func([], [IDL.Bool], []),
    'register_capsule' : IDL.Func([], [CapsuleRegistrationResult], []),
    'register_with_nonce' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'remove_admin' : IDL.Func([IDL.Principal], [IDL.Bool], []),
    'set_migration_enabled' : IDL.Func([IDL.Bool], [Result_4], []),
    'set_personal_canister_creation_enabled' : IDL.Func(
        [IDL.Bool],
        [Result_4],
        [],
      ),
    'store_gallery_forever' : IDL.Func(
        [GalleryData],
        [StoreGalleryResponse],
        [],
      ),
    'update_gallery' : IDL.Func(
        [IDL.Text, GalleryUpdateData],
        [UpdateGalleryResponse],
        [],
      ),
    'update_memory_in_capsule' : IDL.Func(
        [IDL.Text, MemoryUpdateData],
        [MemoryOperationResponse],
        [],
      ),
    'verify_nonce' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Principal)], ['query']),
    'whoami' : IDL.Func([], [IDL.Principal], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
