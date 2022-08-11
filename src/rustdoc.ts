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
export interface Crate {
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

export interface ExternalCrate {
  name: string
  html_root_url?: string
}

// For external (not defined in the local crate) items, you don't get the same level of
// information. This struct should contain enough to generate a link/reference to the item in
// question, or can be used by a tool that takes the json output of multiple crates to find
// the actual item definition with all the relevant info.
export interface ItemSummary {
  crate_id: CrUid
  path: string[] // list of path components for the fully qualified path
  kind: ItemKind
}

export interface Item {
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

export interface Span {
  filename: string // path to the source file relative from where rustdoc was invoked from

  // zero indexed Line and Column of the first and last chars respectively
  begin: [number, number]
  end: [number, number]
}

export interface Deprecation {
  since?: string
  note?: string
}

export interface VisPublic {
  tag: 'Public'
}
export interface VisDefault {
  tag: 'Default'
}
export interface VisCrate {
  tag: 'Crate'
}
export interface VisRestricted {
  tag: 'Restricted'
  parent: Id
  path: string
}

export type Visibility =
  | VisPublic
  // For the most part items are private by default. The exceptions are associated items of
  // public traits and variants of public enums.
  | VisDefault
  | VisCrate
  // For `pub(in path)` visibility. `parent` is the module it's restricted to and `path` is how
  // that module was referenced (like `"super::super"` or `"crate::foo::bar"`).
  | VisRestricted

export interface DynTrait {
  // All the traits implemented. One of them is the vtable, and the rest must be auto traits.
  traits: PolyTrait[]
  // The lifetime of the whole dyn object
  // dyn Debug + 'static
  //             ^^^^^^^ - this part
  lifetime?: string
}

// A trait and potential HRTBs
export interface PolyTrait {
  trait: Type
  // Used for Higher-Rank Trait Bounds (HRTBs)
  // dyn for<'a> Fn() -> &'a i32
  //     ^^^^^^^ - this part
  generic_params: GenericParamDef[]
}

export interface GAsAngleBracketed {
  tag: 'AngleBracketed'
  args: GenericArg[]
  bindings: TypeBinding[]
}
export interface GAsParenthesized {
  tag: 'Parenthesized'
  inputs: Type[]
  output?: Type
}

// #[serde(rename_all = "snake_case")]
export type GenericArgs =
  | GAsAngleBracketed // <'a, 32, B: Copy, C = u32>
  | GAsParenthesized // Fn(A, B) -> C

export interface GALifetime {
  tag: 'Lifetime'
  val: string
}
export interface GAType {
  tag: 'Type'
  val: Type
}
export interface GAConst {
  tag: 'Const'
  val: Constant
}
export interface GAInfer {
  tag: 'Infer'
}

// #[serde(rename_all = "snake_case")]
export type GenericArg = GALifetime | GAType | GAConst | GAInfer

export interface Constant {
  type: Type
  expr: string
  value?: string
  is_literal: boolean
}

export interface TypeBinding {
  name: string
  args: GenericArgs
  binding: TypeBindingKind
}

// #[serde(rename_all = "snake_case")]
export interface TBKEquality {
  tag: 'Equality'
  val: Term
}

export interface TBKConstraint {
  tag: 'Constraint'
  val: GenericBound[]
}

export type TypeBindingKind = TBKEquality | TBKConstraint

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

export interface IEModule {
  tag: 'Module'
  val: Module
}
export interface IEExternCrate {
  tag: 'ExternCrate'
  name: string
  rename?: string
}
export interface IEImport {
  tag: 'Import'
  val: Import
}
export interface IEUnion {
  tag: 'Union'
  val: Union
}
export interface IEStruct {
  tag: 'Struct'
  val: Struct
}
export interface IEStructField {
  tag: 'StructField'
  val: Type
}
export interface IEEnum {
  tag: 'Enum'
  val: Enum
}
export interface IEVariant {
  tag: 'Variant'
  val: Variant
}
export interface IEFunction {
  tag: 'Function'
  val: Fn
}
export interface IETrait {
  tag: 'Trait'
  val: Trait
}
export interface IETraitAlias {
  tag: 'TraitAlias'
  val: TraitAlias
}
export interface IEMethod {
  tag: 'Method'
  val: Method
}
export interface IEImpl {
  tag: 'Impl'
  val: Impl
}
export interface IETypedef {
  tag: 'Typedef'
  val: Typedef
}
export interface IEOpaqueTy {
  tag: 'OpaqueTy'
  val: OpaqueTy
}
export interface IEConstant {
  tag: 'Constant'
  val: Constant
}
export interface IEStatic {
  tag: 'Static'
  val: Static
}
// `type`s from an extern block
export interface IEForeignType {
  tag: 'ForeignType'
}
// Declarative macro_rules! macro
export interface IEMacro {
  tag: 'Macro'
  val: string
}
export interface IEProcMacro {
  tag: 'ProcMacro'
  val: ProcMacro
}
export interface IEPrimitiveType {
  tag: 'PrimitiveType'
  val: string
}
export interface IEAssocConst {
  tag: 'AssocConst'
  type: Type
  default?: string // e.g. `const X: usize = 5;`
}
export interface IEAssocType {
  tag: 'AssocType'
  generics: Generics
  bounds: GenericBound[]
  default?: Type // e.g. `type X = usize;`
}

// #[serde(tag = "kind", content = "inner", rename_all = "snake_case")]
export type ItemEnum =
  | IEModule
  | IEExternCrate
  | IEImport
  | IEUnion
  | IEStruct
  | IEStructField
  | IEEnum
  | IEVariant
  | IEFunction
  | IETrait
  | IETraitAlias
  | IEMethod
  | IEImpl
  | IETypedef
  | IEOpaqueTy
  | IEConstant
  | IEStatic
  | IEForeignType
  | IEMacro
  | IEProcMacro
  | IEPrimitiveType
  | IEAssocConst
  | IEAssocType

export interface Module {
  is_crate: boolean
  items: Id[]
  // If `true`, this module is not part of the public API, but it contains
  // items that are re-exported as public API.
  is_stripped: boolean
}

export interface Union {
  generics: Generics
  fields_stripped: boolean
  fields: Id[]
  impls: Id[]
}

export interface Struct {
  struct_type: StructType
  generics: Generics
  fields_stripped: boolean
  fields: Id[]
  impls: Id[]
}

export interface Enum {
  generics: Generics
  variants_stripped: boolean
  variants: Id[]
  impls: Id[]
}

export interface VPlain {
  tag: 'Plain'
}
export interface VTuple {
  tag: 'Tuple'
  val: Type[]
}
export interface VStruct {
  tag: 'Struct'
  val: Id[]
}

// #[serde(rename_all = "snake_case")]
// #[serde(tag = "variant_kind", content = "variant_inner")]
export type Variant = VPlain | VTuple | VStruct

// #[serde(rename_all = "snake_case")]
export enum StructType {
  Plain,
  Tuple,
  Unit,
}

export interface Header {
  const: boolean
  unsafe: boolean
  async: boolean
  abi: Abi
}

export interface AbiRust {
  tag: 'Rust'
}
export interface AbiC {
  tag: 'C'
  unwind: boolean
}
export interface AbiCdecl {
  tag: 'Cdecl'
  unwind: boolean
}
export interface AbiStdcall {
  tag: 'Stdcall'
  unwind: boolean
}
export interface AbiFastcall {
  tag: 'Fastcall'
  unwind: boolean
}
export interface AbiAapcs {
  tag: 'Aapcs'
  unwind: boolean
}
export interface AbiWin64 {
  tag: 'Win64'
  unwind: boolean
}
export interface AbiSysV64 {
  tag: 'SysV64'
  unwind: boolean
}
export interface AbiSystem {
  tag: 'System'
  unwind: boolean
}
export interface AbiOther {
  tag: 'Other'
  val: string
}

export type Abi =
  // We only have a concrete listing here for stable ABI's because their are so many
  // See rustc_ast_passes::feature_gate::PostExpansionVisitor::check_abi for the list
  | AbiRust
  | AbiC
  | AbiCdecl
  | AbiStdcall
  | AbiFastcall
  | AbiAapcs
  | AbiWin64
  | AbiSysV64
  | AbiSystem
  | AbiOther

export interface Fn {
  decl: FnDecl
  generics: Generics
  header: Header
}

export interface Method {
  decl: FnDecl
  generics: Generics
  header: Header
  has_body: boolean
}

export interface Generics {
  params: GenericParamDef[]
  where_predicates: WherePredicate[]
}

export interface GenericParamDef {
  name: string
  kind: GenericParamDefKind
}

export interface GPDKLifetime {
  tag: 'Lifetime'
  outlives: string[]
}
export interface GPDKType {
  tag: 'Type'
  bounds: GenericBound[]
  default?: Type
  // This is normally `false`, which means that this generic parameter is
  // declared in the Rust source text.
  ///
  // If it is `true`, this generic parameter has been introduced by the
  // compiler behind the scenes.
  ///
  // # Example
  ///
  // Consider
  ///
  // ```ignore (pseudo-rust)
  // pub fn f(_: impl Trait) {}
  // ```
  ///
  // The compiler will transform this behind the scenes to
  ///
  // ```ignore (pseudo-rust)
  // pub fn f<impl Trait: Trait>(_: impl Trait) {}
  // ```
  ///
  // In this example, the generic parameter named `impl Trait` (and which
  // is bound by `Trait`) is synthetic, because it was not originally in
  // the Rust source text.
  synthetic: boolean
}
export interface GPDKConst {
  tag: 'Const'
  type: Type
  default?: string
}

// #[serde(rename_all = "snake_case")]
export type GenericParamDefKind = GPDKLifetime | GPDKType | GPDKConst

export interface WPBoundPredicate {
  tag: 'BoundPredicate'
  type: Type
  bounds: GenericBound[]
  // Used for Higher-Rank Trait Bounds (HRTBs)
  // where for<'a> &'a T: Iterator,"
  //       ^^^^^^^ - this part
  generic_params: GenericParamDef[]
}
export interface WPRegionPredicate {
  tag: 'RegionPredicate'
  lifetime: string
  bounds: GenericBound[]
}
export interface WPEqPredicate {
  tag: 'EqPredicate'
  lhs: Type
  rhs: Term
}

// #[serde(rename_all = "snake_case")]
export type WherePredicate =
  | WPBoundPredicate
  | WPRegionPredicate
  | WPEqPredicate

export interface GBTraitBound {
  tag: 'TraitBound'
  trait: Type
  // Used for Higher-Rank Trait Bounds (HRTBs)
  // where F: for<'a, 'b> Fn(&'a u8, &'b u8)
  //          ^^^^^^^^^^^ - this part
  generic_params: GenericParamDef[]
  modifier: TraitBoundModifier
}
export interface GBOutlives {
  tag: 'Outlives'
  val: string
}

// #[serde(rename_all = "snake_case")]
export type GenericBound = GBTraitBound | GBOutlives

// #[serde(rename_all = "snake_case")]
export enum TraitBoundModifier {
  None,
  Maybe,
  MaybeConst,
}

export interface TrType {
  tag: 'Type'
  val: Type
}
export interface TrConstant {
  tag: 'Constant'
  val: Constant
}

// #[serde(rename_all = "snake_case")]
export type Term = TrType | TrConstant

// Structs, enums, and traits
export interface TyResolvedPath {
  tag: 'ResolvedPath'
  name: string
  id: Id
  args?: GenericArgs
  param_names: GenericBound[]
}
export interface TyDynTrait {
  tag: 'DynTrait'
  val: DynTrait
}
// Parameterized types
export interface TyGeneric {
  tag: 'Generic'
  val: string
}
// Fixed-size numeric types (plus int/usize/float), char, arrays, slices, and tuples
export interface TyPrimitive {
  tag: 'Primitive'
  val: string
}
// `extern "ABI" fn`
export interface TyFunctionPtr {
  tag: 'FunctionPtr'
  val: FnPtr
}
// `(string, u32, Box<usize>)`
export interface TyTuple {
  tag: 'Tuple'
  val: Type[]
}
// `[u32]`
export interface TySlice {
  tag: 'Slice'
  val: Type
}
// [u32; 15]
export interface TyArray {
  tag: 'Array'
  type: Type
  len: string
}
// `impl TraitA + TraitB + ...`
export interface TyImplTrait {
  tag: 'ImplTrait'
  val: GenericBound[]
}
// `_`
export interface TyInfer {
  tag: 'Infer'
}
// `*mut u32`, `*u8`, etc.
export interface TyRawPointer {
  tag: 'RawPointer'
  mutable: boolean
  type: Type
}
// `&'a mut string`, `&str`, etc.
export interface TyBorrowedRef {
  tag: 'BorrowedRef'
  lifetime?: string
  mutable: boolean
  type: Type
}
// `<Type as Trait>::Name` or associated types like `T::Item` where `T: Iterator`
export interface TyQualifiedPath {
  tag: 'QualifiedPath'
  name: string
  args: GenericArgs
  self_type: Type
  trait: Type
}

// #[serde(rename_all = "snake_case")]
// #[serde(tag = "kind", content = "inner")]
export type Type =
  | TyResolvedPath
  | TyDynTrait
  | TyGeneric
  | TyPrimitive
  | TyFunctionPtr
  | TyTuple
  | TySlice
  | TyArray
  | TyImplTrait
  | TyInfer
  | TyRawPointer
  | TyBorrowedRef
  | TyQualifiedPath

export interface FnPtr {
  decl: FnDecl
  // Used for Higher-Rank Trait Bounds (HRTBs)
  // for<'c> fn(val: &'c i32) -> i32
  // ^^^^^^^ - this part
  generic_params: GenericParamDef[]
  header: Header
}

export interface FnDecl {
  inputs: [string, Type][]
  output?: Type
  c_variadic: boolean
}

export interface Trait {
  is_auto: boolean
  is_unsafe: boolean
  items: Id[]
  generics: Generics
  bounds: GenericBound[]
  implementations: Id[]
}

export interface TraitAlias {
  generics: Generics
  params: GenericBound[]
}

export interface Impl {
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

// #[serde(rename_all = "snake_case")]
export interface Import {
  source: string // full path being imported
  // May be different from the last segment of `source` when renaming imports:
  // `use source as name;`
  name: string
  id?: Id // ID of the item being imported, null in case of re-exports of primitives. eg. `pub use i32 as my_i32`
  glob: boolean // does this import use a glob? eg. `use source::*`
}

export interface ProcMacro {
  kind: MacroKind
  helpers: string[]
}

// #[serde(rename_all = "snake_case")]
export enum MacroKind {
  Bang, // bang macro: foo!()
  Attr, // attribute macro: #[foo]
  Derive, // derive macro: #[derive(Eq, Clone)]
}

export interface Typedef {
  type: Type
  generics: Generics
}

export interface OpaqueTy {
  bounds: GenericBound[]
  generics: Generics
}

export interface Static {
  type: Type
  mutable: boolean
  expr: string
}
