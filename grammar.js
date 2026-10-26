const C = require("tree-sitter-c/grammar")

module.exports = grammar(C, {
    name: 'glsl',

    conflicts: ($, original) => original.concat([
        [$.function_definition, $.declaration],
        [$.declaration],
        [$.expression, $.array_type_specifier],
        [$.type_specifier, $.array_type_specifier],
        [$.type_specifier, $.expression, $.array_type_specifier],
        [$._declarator, $.type_specifier, $.array_type_specifier],
        [$.declaration, $.type_qualifier],
        [$.parameter_declaration, $.type_qualifier]
    ]),

    rules: {
        type_specifier: ($, original) => choice(original, $.array_type_specifier),
        array_type_specifier: $ => prec.right(seq(
            choice($.primitive_type, $._type_identifier),
            repeat1(seq('[', optional($.expression), ']')),
        )),
        call_expression: ($, original) => choice(original, prec(18, seq(
            field('function', choice(alias($.primitive_type, $.identifier), $.array_type_specifier)),
            field('arguments', $.argument_list),
        ))),
        type_qualifier: ($, original) => choice(original, 'highp', 'mediump', 'lowp'),
        _top_level_item: ($, original) => choice(
            ...original.members.filter((member) => member.content?.name != '_old_style_function_definition'),
            $.preproc_extension,
        ),

        _block_item: ($, original) => choice(
            ...original.members.filter((member) => member.content?.name != '_old_style_function_definition'),
            $.preproc_extension,
        ),

        function_definition: ($, original) => seq(
            optional(
                seq(
                    'subroutine',
                    optional(
                        seq('(', optional($.identifier), repeat(seq(',', $.identifier)), ')')
                    ),
                )
            )
            , original
        ),

        preproc_extension: $ => seq(
          field('directive', $.preproc_directive),
          field('extension', $.identifier),
          token.immediate(/[ \t]*:[ \t]*/),
          field('behavior', $.extension_behavior),
          token.immediate(/\r?\n/),
        ),

        extension_behavior: $ => choice("require", "enable", "warn", "disable"),

        declaration: ($, original) =>
            choice(
                seq('precision', choice('highp', 'mediump', 'lowp', $.identifier), $.type_specifier, ';'),
                seq($.layout_specification, choice('in', 'out', 'uniform', 'buffer'), ';'),
                seq(choice("invariant", "precise"), $.identifier, ";"), seq(
                repeat(
                    choice(
                        'in',
                        'out',
                        'inout',
                        'uniform',
                        'shared',
                        'attribute',
                        'varying',
                        'buffer',
                        'coherent', 'restrict',
                        'readonly',
                        'writeonly',
                        'subroutine',
                        'centroid',
                        'sample',
                        'patch',
                        'smooth',
                        'flat',
                        'noperspective',
                        'invariant',
                        'precise',
                        $.extension_storage_class,
                        $.layout_specification,
                    )
                ), choice(
                    seq($.identifier, $.field_declaration_list, optional(choice($.identifier, $.array_declarator)), ";"),
                    original
                )
            )),

        field_declaration: ($, original) =>
            seq(
                repeat(choice(
                    'in',
                    'out',
                    'inout',
                    'uniform',
                    'shared',
                    'attribute',
                    'varying',
                    'buffer',
                    'coherent', 'restrict',
                    'readonly',
                    'writeonly',
                    'subroutine',
                    'centroid',
                    'sample',
                    'patch',
                    'smooth',
                    'flat',
                    'noperspective',
                    'invariant',
                    'precise',
                    $.extension_storage_class,
                    $.layout_specification,
                )), original),

        parameter_declaration: ($, original) =>
            seq(
                repeat(
                    choice(
                        'in',
                        'out',
                        'inout',
                        'uniform',
                        'shared',
                        'attribute',
                        'varying',
                        'buffer',
                        'coherent', 'restrict',
                        'readonly',
                        'writeonly',
                        'centroid',
                        'sample',
                        'patch',
                        'smooth',
                        'flat',
                        'noperspective',
                        'precise',
                        $.layout_specification,
                    )
                ), original
            ),

        extension_storage_class: _ => choice(
            'rayPayloadEXT',
            'rayPayloadInEXT',
            'hitAttributeEXT',
            'callableDataEXT',
            'callableDataInEXT',
            'shaderRecordEXT',
            'rayPayloadNV',
            'rayPayloadInNV',
            'hitAttributeNV',
            'callableDataNV',
            'callableDataInNV',
            'shaderRecordNV',
        ),

        layout_specification: ($) => seq("layout", $.layout_qualifiers),
        layout_qualifiers: ($) => seq("(", $.qualifier, repeat(seq(",", $.qualifier)), ")"),
        qualifier: ($) => choice("shared", $.identifier, seq($.identifier, "=", $.expression)),
    }
});
