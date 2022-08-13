// Rustdoc's JSON output interface
//
// These types are the public API exposed through the `--output-format json` flag. The [`Crate`]
// struct is the root of the JSON blob and all other items are contained within.
//
// https://rust-lang.github.io/rfcs/2963-rustdoc-json.html
// https://github.com/rust-lang/rust/blob/master/src/rustdoc-json-types/lib.rs

export const FORMAT_VERSION = 17 // rustdoc format-version

export type Id = string // unique item id
export type CrUid = number // unique crate id

// A Crate is the root of the emitted JSON blob. It contains all type/documentation information
// about the language items in the local crate, as well as info about external items to allow
// tools to find or link to them.
export type Crate = {
  root: Id // id of the root Module item for the local crate
  crate_version?: string // version string given to `--crate-version`
  includes_private: boolean // does output includes private items

  // collection of all items in the local crate as well as some external traits and their
  // items that are referenced locally
  index: [Id: Item]
  paths: [Id: ItemSummary]
  external_crates: [CrUid: ExternalCrate]

  format_version: number
}

export type ExternalCrate = {
  name: string
  html_root_url?: string
}

// For external (not defined in the local crate) items, you don't get the same level of
// information. This struct should contain enough to generate a link/reference to the item in
// question, or can be used by a tool that takes the json output of multiple crates to find
// the actual item definition with all the relevant info.
export type ItemSummary = {
  crate_id: CrUid
  path: string[] // list of path components for the fully qualified path
  kind: ItemKind
}

export type Item = {
  id: Id
  crate_id: CrUid

  name?: string // some items such as impls don't have names
  span?: Span // source location, absent for macro expansions and inline asm
  visibility: Visibility
  docs?: string // markdown docstring, can be empty

  links: [string: Id] // resolves intra-doc links from the docstring to their IDs https://github.com/rust-lang/rfcs/blob/master/text/1946-intra-rustdoc-links.md
  attrs: string[] // stringified attributes (e.g. `"#[inline]"`)
  deprecation?: Deprecation

  // #[serde(flatten)]
  inner: ItemEnum
}

export type Span = {
  filename: string // path to the source file relative from where rustdoc was invoked from

  // zero indexed Line and Column of the first and last chars respectively
  begin: [number, number]
  end: [number, number]
}

export type Deprecation = {
  since?: string
  note?: string
}

export type Visibility =
  | { tag: 'Public' }
  // For the most part items are private by default. The exceptions are associated items of
  // public traits and variants of public enums.
  | { tag: 'Default' }
  | { tag: 'Crate' }
  // For `pub(in path)` visibility. `parent` is the module it's restricted to and `path` is how
  // that module was referenced (like `"super::super"` or `"crate::foo::bar"`).
  | { tag: 'Restricted'; parent: Id; path: string }

// A trait and potential HRTBs
export type PolyTrait = {
  trait: Type
  // dyn for<'a> Fn() -> &'a i32 - `for<...>` part in HRTBs
  generic_params: GenericParamDef[]
}

// #[serde(rename_all = "snake_case")]
export type GenericArgs =
  | { tag: 'AngleBracketed'; args: GenericArg[]; bindings: TypeBinding[] } // <'a, 32, B: Copy, C = u32>
  | { tag: 'Parenthesized'; inputs: Type[]; output?: Type } // Fn(A, B) -> C

// #[serde(rename_all = "snake_case")]
export type GenericArg =
  | { tag: 'Lifetime'; val: string }
  | { tag: 'Type'; val: Type }
  | { tag: 'Constant'; val: Constant }
  | { tag: 'Infer' }

export type Constant = {
  type: Type
  expr: string
  value?: string
  is_literal: boolean
}

export type TypeBinding = {
  name: string
  args: GenericArgs
  binding:
    | { tag: 'Equality'; val: Term }
    | { tag: 'Constraint'; val: GenericBound[] }
}

// #[serde(rename_all = "snake_case")]
export enum ItemKind {
  Module,
  ExternCrate,
  Import,
  Struct,
  StructField,
  Union,
  Enum,
  Variant,
  Function,
  Typedef,
  OpaqueTy,
  Constant,
  Trait,
  TraitAlias,
  Method,
  Impl,
  Static,
  ForeignType,
  Macro,
  ProcAttribute,
  ProcDerive,
  AssocConst,
  AssocType,
  Primitive,
  Keyword,
}

export type Module = {
  tag: 'Module'
  is_crate: boolean
  items: Id[]
  // If `true`, this module is not part of the public API, but it contains
  // items that are re-exported as public API.
  is_stripped: boolean
}

export type Import = {
  tag: 'Import'
  source: string // full path being imported
  // May be different from the last segment of `source` when renaming imports:
  // `use source as name;`
  name: string
  id?: Id // ID of the item being imported, null in case of re-exports of primitives. eg. `pub use i32 as my_i32`
  glob: boolean // does this import use a glob? eg. `use source::*`
}

export type Union = {
  tag: 'Union'
  generics: Generics
  fields_stripped: boolean
  fields: Id[]
  impls: Id[]
}

export type Struct = {
  tag: 'Struct'
  struct_type: StructType
  generics: Generics
  fields_stripped: boolean
  fields: Id[]
  impls: Id[]
}

export type Enum = {
  tag: 'Enum'
  generics: Generics
  variants_stripped: boolean
  variants: Id[]
  impls: Id[]
}

export type Variant = {
  tag: 'Variant'
  val:
    | { tag: 'Plain' }
    | { tag: 'Tuple'; val: Type[] }
    | { tag: 'Struct'; val: Id[] }
}

export type Trait = {
  tag: 'Trait'
  is_auto: boolean
  is_unsafe: boolean
  items: Id[]
  generics: Generics
  bounds: GenericBound[]
  implementations: Id[]
}

export type Method = {
  tag: 'Method'
  decl: FnDecl
  generics: Generics
  header: Header
  has_body: boolean
}

export type Impl = {
  tag: 'Impl'
  is_unsafe: boolean
  generics: Generics
  provided_trait_methods: string[]
  trait?: Type
  for: Type
  items: Id[]
  negative: boolean
  synthetic: boolean
  blanket_impl?: Type
}

// Declarative macro_rules! macro
export type AssocType = {
  tag: 'AssocType'
  generics: Generics
  bounds: GenericBound[]
  default?: Type // e.g. `type X = usize;`
}

// #[serde(tag = "kind", content = "inner", rename_all = "snake_case")]
export type ItemEnum =
  | Module
  | { tag: 'ExternCrate'; name: string; rename?: string }
  | Import
  | Union
  | Struct
  | { tag: 'StructField'; val: Type }
  | Enum
  | Variant
  | { tag: 'Function'; decl: FnDecl; generics: Generics; header: Header }
  | Trait
  | { tag: 'TraitAlias'; generics: Generics; params: GenericBound[] }
  | Method
  | Impl
  | { tag: 'Typedef'; type: Type; generics: Generics }
  | { tag: 'OpaqueTy'; bounds: GenericBound[]; generics: Generics }
  | { tag: 'Constant'; val: Constant }
  | { tag: 'Static'; type: Type; mutable: boolean; expr: string }
  | { tag: 'ForeignType' } // `type`s from an extern block
  | { tag: 'Macro'; val: string }
  | { tag: 'ProcMacro'; kind: MacroKind; helpers: string[] }
  | { tag: 'PrimitiveType'; val: string }
  | { tag: 'AssocConst'; type: Type; default?: string } // const X: usize = 5;
  | AssocType

// #[serde(rename_all = "snake_case")]
export enum StructType {
  Plain,
  Tuple,
  Unit,
}

export type Header = {
  const: boolean
  unsafe: boolean
  async: boolean
  abi: Abi
}

// We only have a concrete listing here for stable ABI's because their are so many
// See rustc_ast_passes::feature_gate::PostExpansionVisitor::check_abi for the list
export type Abi =
  | { tag: 'Rust' }
  | { tag: 'C'; unwind: boolean }
  | { tag: 'Cdecl'; unwind: boolean }
  | { tag: 'Stdcall'; unwind: boolean }
  | { tag: 'Fastcall'; unwind: boolean }
  | { tag: 'Aapcs'; unwind: boolean }
  | { tag: 'Win64'; unwind: boolean }
  | { tag: 'SysV64'; unwind: boolean }
  | { tag: 'System'; unwind: boolean }
  | { tag: 'Other'; val: string }

export type Generics = {
  params: GenericParamDef[]
  where_predicates: WherePredicate[]
}

export type GenericParamDef = {
  name: string
  kind:
    | { tag: 'Lifetime'; outlives: string[] }
    | { tag: 'Const'; type: Type; default?: string }
    | GPDKType
}

export type GPDKType = {
  tag: 'Type'
  bounds: GenericBound[]
  default?: Type
  // This is normally `false`, which means that this generic parameter is
  // declared in the Rust source text. If it is `true`, this generic parameter
  // has been introduced by the compiler behind the scenes.
  //
  // For example, consider
  //   pub fn f(_: impl Trait) {}
  // The compiler will transform this behind the scenes to
  //   pub fn f<impl Trait: Trait>(_: impl Trait) {}
  //
  // In this example, the generic parameter named `impl Trait` (and which
  // is bound by `Trait`) is synthetic, because it was not originally in
  // the Rust source text.
  synthetic: boolean
}

export type WPBoundPredicate = {
  tag: 'BoundPredicate'
  type: Type
  bounds: GenericBound[]
  // where for<'a> &'a T: Iterator," - `for<...>` part in HRTBs
  generic_params: GenericParamDef[]
}

export type WPRegionPredicate = {
  tag: 'RegionPredicate'
  lifetime: string
  bounds: GenericBound[]
}

export type WPEqPredicate = {
  tag: 'EqPredicate'
  lhs: Type
  rhs: Term
}

// #[serde(rename_all = "snake_case")]
export type WherePredicate =
  | WPBoundPredicate
  | WPRegionPredicate
  | WPEqPredicate

export type GBTraitBound = {
  tag: 'TraitBound'
  trait: Type
  // where F: for<'a, 'b> Fn(&'a u8, &'b u8) - `for<...>` part in HRTBs
  generic_params: GenericParamDef[]
  modifier: 'none' | 'maybe' | 'maybe_const'
}

export type GBOutlives = {
  tag: 'Outlives'
  val: string
}

// #[serde(rename_all = "snake_case")]
export type GenericBound = GBTraitBound | GBOutlives

// #[serde(rename_all = "snake_case")]
export type Term =
  | { tag: 'Type'; val: Type }
  | { tag: 'Constant'; val: Constant }

// Structs, enums, and traits
export type ResolvedPath = {
  tag: 'ResolvedPath'
  name: string
  id: Id
  args?: GenericArgs
  param_names: GenericBound[]
}

export type DynTrait = {
  tag: 'DynTrait'
  // All the traits implemented. One of them is the vtable, and the rest must be auto traits.
  traits: PolyTrait[]
  // The lifetime of the whole dyn object
  // dyn Debug + 'static
  //             ^^^^^^^ - this part
  lifetime?: string
}

// `extern "ABI" fn`
export type FunctionPtr = {
  tag: 'FunctionPtr'
  decl: FnDecl
  // for<'c> fn(val: &'c i32) -> i32 - `for<...>` part in HRTBs
  generic_params: GenericParamDef[]
  header: Header
}

// `<Type as Trait>::Name` or associated types like `T::Item` where `T: Iterator`
export type QualifiedPath = {
  tag: 'QualifiedPath'
  name: string
  args: GenericArgs
  self_type: Type
  trait: Type
}

// #[serde(rename_all = "snake_case")]
// #[serde(tag = "kind", content = "inner")]
export type Type =
  | ResolvedPath
  | DynTrait
  | { tag: 'Generic'; val: string } // Parameterized types
  | { tag: 'Primitive'; val: string } // Fixed-size numeric types (plus int/usize/float), char, arrays, slices, and tuples
  | FunctionPtr
  | { tag: 'Tuple'; val: Type[] } // (string, u32, Box<usize>)
  | { tag: 'Slice'; val: Type } // [u32]
  | { tag: 'Array'; type: Type; len: string } // [u32; 15]
  | { tag: 'ImplTrait'; val: GenericBound[] } // impl TraitA + TraitB + ...
  | { tag: 'Infer' } // _
  | { tag: 'RawPointer'; mutable: boolean; type: Type } // *mut u32, *u8, etc.
  | { tag: 'BorrowedRef'; lifetime?: string; mutable: boolean; type: Type } // &'a mut string, &str, etc.
  | QualifiedPath

export type FnDecl = {
  inputs: [string, Type][]
  output?: Type
  c_variadic: boolean
}

// #[serde(rename_all = "snake_case")]
export enum MacroKind {
  Bang, // bang macro: foo!()
  Attr, // attribute macro: #[foo]
  Derive, // derive macro: #[derive(Eq, Clone)]
}
