# Relationship Types for `relationship` Table

This document defines all possible relationship types stored in the `relationship` table.

---

## **👨‍👩‍👧 Immediate Family**

- `parent` → Generic parent (unspecified gender)
- `father` → Male parent
- `mother` → Female parent
- `child` → Generic child (unspecified gender)
- `son` → Male child
- `daughter` → Female child
- `sibling` → Generic sibling (unspecified gender)
- `brother` → Male sibling
- `sister` → Female sibling

---

## **👴 Extended Family**

- `grandparent` → Generic grandparent
- `grandfather` → Male grandparent
- `grandmother` → Female grandparent
- `grandchild` → Generic grandchild
- `grandson` → Male grandchild
- `granddaughter` → Female grandchild
- `uncle` → Brother of a parent
- `aunt` → Sister of a parent
- `nephew` → Son of a sibling
- `niece` → Daughter of a sibling
- `cousin` → Generic cousin (unspecified parent’s side)
- `cousin_maternal` → Cousin through mother's side
- `cousin_paternal` → Cousin through father's side

---

## **💍 Marriage & Partnerships**

- `spouse` → Generic married partner
- `husband` → Male spouse
- `wife` → Female spouse
- `partner` → Generic romantic partner (not necessarily married)

---

## **👨‍👩‍👧‍👦 In-Laws**

- `parent_in_law` → Generic parent-in-law
- `father_in_law` → Husband's or wife's father
- `mother_in_law` → Husband's or wife's mother
- `child_in_law` → Generic child-in-law
- `son_in_law` → Husband of one's child
- `daughter_in_law` → Wife of one's child
- `sibling_in_law` → Generic sibling-in-law
- `brother_in_law` → Husband of a sibling or spouse's brother
- `sister_in_law` → Wife of a sibling or spouse's sister

---

## **🔄 Step-Family**

- `step_parent` → Generic stepparent
- `step_father` → Husband of a biological/adoptive mother
- `step_mother` → Wife of a biological/adoptive father
- `step_child` → Generic stepchild
- `step_son` → Son of a spouse (not biologically related)
- `step_daughter` → Daughter of a spouse (not biologically related)
- `step_sibling` → Generic stepsibling
- `step_brother` → Male stepsibling
- `step_sister` → Female stepsibling

---

## **🛡️ Other Significant Relationships**

- `mentor` → Professional or personal guide
- `guardian` → Legal guardian
- `godparent` → Religious or symbolic guardian
- `godfather` → Male godparent
- `godmother` → Female godparent
- `godchild` → Generic godchild
- `godson` → Male godchild
- `goddaughter` → Female godchild
- `friend` → Close non-familial relationship
- `acquaintance` → Weak or distant social connection

---

## **📝 Notes**

- The `relationshipType` column in the database will be based on this list.
- Some relationships (e.g., cousins) may need additional clarification (`throughParentId`).
- Gendered relationships exist **alongside** their gender-neutral versions for flexibility.
