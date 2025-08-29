export const idlFactory = ({ IDL }) => {
  const MemoryAccess = IDL.Rec();
  const PersonRef = IDL.Variant({
    Opaque: IDL.Text,
    Principal: IDL.Principal,
  });
  const CapsuleCreationResult = IDL.Record({
    capsule_id: IDL.Opt(IDL.Text),
    message: IDL.Text,
    success: IDL.Bool,
  });
  const ControllerState = IDL.Record({
    granted_at: IDL.Nat64,
    granted_by: PersonRef,
  });
  const OwnerState = IDL.Record({
    last_activity_at: IDL.Nat64,
    since: IDL.Nat64,
  });
  const ConnectionGroup = IDL.Record({
    id: IDL.Text,
    updated_at: IDL.Nat64,
    members: IDL.Vec(PersonRef),
    name: IDL.Text,
    description: IDL.Opt(IDL.Text),
    created_at: IDL.Nat64,
  });
  const ConnectionStatus = IDL.Variant({
    Blocked: IDL.Null,
    Accepted: IDL.Null,
    Revoked: IDL.Null,
    Pending: IDL.Null,
  });
  const Connection = IDL.Record({
    status: ConnectionStatus,
    updated_at: IDL.Nat64,
    peer: PersonRef,
    created_at: IDL.Nat64,
  });
  const AccessEvent = IDL.Variant({
    CapsuleMaturity: IDL.Nat32,
    Graduation: IDL.Null,
    AfterDeath: IDL.Null,
    Wedding: IDL.Null,
    Birthday: IDL.Nat32,
    Custom: IDL.Text,
    ConnectionCount: IDL.Nat32,
    Anniversary: IDL.Nat32,
  });
  MemoryAccess.fill(
    IDL.Variant({
      Private: IDL.Null,
      Custom: IDL.Record({
        groups: IDL.Vec(IDL.Text),
        individuals: IDL.Vec(PersonRef),
      }),
      EventTriggered: IDL.Record({
        access: MemoryAccess,
        trigger_event: AccessEvent,
      }),
      Public: IDL.Null,
      Scheduled: IDL.Record({
        access: MemoryAccess,
        accessible_after: IDL.Nat64,
      }),
    })
  );
  const MemoryMetadataBase = IDL.Record({
    date_of_memory: IDL.Opt(IDL.Text),
    size: IDL.Nat64,
    people_in_memory: IDL.Opt(IDL.Vec(IDL.Text)),
    mime_type: IDL.Text,
    original_name: IDL.Text,
    uploaded_at: IDL.Text,
    format: IDL.Opt(IDL.Text),
  });
  const NoteMetadata = IDL.Record({
    base: MemoryMetadataBase,
    tags: IDL.Opt(IDL.Vec(IDL.Text)),
  });
  const ImageMetadata = IDL.Record({
    base: MemoryMetadataBase,
    dimensions: IDL.Opt(IDL.Tuple(IDL.Nat32, IDL.Nat32)),
  });
  const DocumentMetadata = IDL.Record({ base: MemoryMetadataBase });
  const AudioMetadata = IDL.Record({
    duration: IDL.Opt(IDL.Nat32),
    base: MemoryMetadataBase,
    channels: IDL.Opt(IDL.Nat8),
    sample_rate: IDL.Opt(IDL.Nat32),
    bitrate: IDL.Opt(IDL.Nat32),
    format: IDL.Opt(IDL.Text),
  });
  const VideoMetadata = IDL.Record({
    height: IDL.Opt(IDL.Nat32),
    duration: IDL.Opt(IDL.Nat32),
    thumbnail: IDL.Opt(IDL.Text),
    base: MemoryMetadataBase,
    width: IDL.Opt(IDL.Nat32),
  });
  const MemoryMetadata = IDL.Variant({
    Note: NoteMetadata,
    Image: ImageMetadata,
    Document: DocumentMetadata,
    Audio: AudioMetadata,
    Video: VideoMetadata,
  });
  const MemoryBlobKind = IDL.Variant({
    MemoryBlobKindExternal: IDL.Null,
    ICPCapsule: IDL.Null,
  });
  const BlobRef = IDL.Record({
    locator: IDL.Text,
    hash: IDL.Opt(IDL.Vec(IDL.Nat8)),
    kind: MemoryBlobKind,
  });
  const MemoryData = IDL.Record({
    data: IDL.Opt(IDL.Vec(IDL.Nat8)),
    blob_ref: BlobRef,
  });
  const MemoryType = IDL.Variant({
    Note: IDL.Null,
    Image: IDL.Null,
    Document: IDL.Null,
    Audio: IDL.Null,
    Video: IDL.Null,
  });
  const MemoryInfo = IDL.Record({
    updated_at: IDL.Nat64,
    date_of_memory: IDL.Opt(IDL.Nat64),
    memory_type: MemoryType,
    name: IDL.Text,
    content_type: IDL.Text,
    created_at: IDL.Nat64,
    uploaded_at: IDL.Nat64,
  });
  const Memory = IDL.Record({
    id: IDL.Text,
    access: MemoryAccess,
    metadata: MemoryMetadata,
    data: MemoryData,
    info: MemoryInfo,
  });
  const Capsule = IDL.Record({
    id: IDL.Text,
    updated_at: IDL.Nat64,
    controllers: IDL.Vec(IDL.Tuple(PersonRef, ControllerState)),
    subject: PersonRef,
    owners: IDL.Vec(IDL.Tuple(PersonRef, OwnerState)),
    created_at: IDL.Nat64,
    connection_groups: IDL.Vec(IDL.Tuple(IDL.Text, ConnectionGroup)),
    connections: IDL.Vec(IDL.Tuple(PersonRef, Connection)),
    memories: IDL.Vec(IDL.Tuple(IDL.Text, Memory)),
    bound_to_web2: IDL.Bool,
  });
  const CapsuleInfo = IDL.Record({
    updated_at: IDL.Nat64,
    subject: PersonRef,
    capsule_id: IDL.Text,
    is_owner: IDL.Bool,
    created_at: IDL.Nat64,
    bound_to_web2: IDL.Bool,
    is_self_capsule: IDL.Bool,
    is_controller: IDL.Bool,
  });
  const CapsuleHeader = IDL.Record({
    id: IDL.Text,
    updated_at: IDL.Nat64,
    subject: PersonRef,
    owner_count: IDL.Nat32,
    created_at: IDL.Nat64,
    controller_count: IDL.Nat32,
    memory_count: IDL.Nat32,
  });
  const CapsuleRegistrationResult = IDL.Record({
    capsule_id: IDL.Opt(IDL.Text),
    is_new: IDL.Bool,
    message: IDL.Text,
    success: IDL.Bool,
  });
  return IDL.Service({
    add_admin: IDL.Func([IDL.Principal], [IDL.Bool], []),
    create_capsule: IDL.Func([PersonRef], [CapsuleCreationResult], []),
    get_capsule: IDL.Func([IDL.Text], [IDL.Opt(Capsule)], ["query"]),
    get_user: IDL.Func([], [IDL.Opt(CapsuleInfo)], ["query"]),
    greet: IDL.Func([IDL.Text], [IDL.Text], ["query"]),
    list_admins: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    list_my_capsules: IDL.Func([], [IDL.Vec(CapsuleHeader)], ["query"]),
    list_superadmins: IDL.Func([], [IDL.Vec(IDL.Principal)], ["query"]),
    list_users: IDL.Func([], [IDL.Vec(CapsuleHeader)], ["query"]),
    mark_bound: IDL.Func([], [IDL.Bool], []),
    mark_capsule_bound_to_web2: IDL.Func([], [IDL.Bool], []),
    prove_nonce: IDL.Func([IDL.Text], [IDL.Bool], []),
    register: IDL.Func([], [IDL.Bool], []),
    register_capsule: IDL.Func([], [CapsuleRegistrationResult], []),
    register_with_nonce: IDL.Func([IDL.Text], [IDL.Bool], []),
    remove_admin: IDL.Func([IDL.Principal], [IDL.Bool], []),
    verify_nonce: IDL.Func([IDL.Text], [IDL.Opt(IDL.Principal)], ["query"]),
    whoami: IDL.Func([], [IDL.Principal], ["query"]),
  });
};
export const init = ({ IDL }) => {
  return [];
};
