import { FC, PropsWithChildren, ReactNode } from 'react';
import { ValueView } from '../value';
import './ellipsis.css';

function getType(value: any): string {
  // Check for null explicitly as typeof null === 'object'
  if (value === null) {
    return 'null';
  }

  // Check for Array
  if (Array.isArray(value)) {
    return 'Array';
  }

  // Check for special object types: Set and Map
  if (value instanceof Set) {
    return 'Set';
  }
  if (value instanceof Map) {
    return 'Map';
  }

  // Check for object (this is placed after the checks for Array, Set, and Map)
  if (typeof value === 'object') {
    return 'Object';
  }

  // Covers undefined and other primitive types
  return typeof value;
}

function getSubValue(value: any) {
  switch (getType(value)) {
    case 'Array':
      return '[...]';
    case 'Object':
      return '{...}';
    default:
      return (
        <ValueView
          value={value}
          displayDataTypes={false}
          displayObjectSize={false}
          isSet={false}
          enableClipboard={false}
          indentWidth={4}
        />
      );
  }
}
function getEllipsisStr(obj: any) {
  let result: ReactNode = '';
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    console.log('strArr', Object.entries(obj));
    result = (
      <span style={{ margin: '0 2px' }}>
        {Object.entries(obj).map(([key, value], index) => {
          return (
            <span>
              <span className="w-rjv-object-key" style={{ opacity: 0.4 }}>
                {key}:
              </span>
              <span className="w-rjv-ellipsis-value">{getSubValue(value)}</span>
              {index !== Object.entries(obj).length - 1 ? ', ' : ''}
            </span>
          );
        })}
      </span>
    );
  } else if (Array.isArray(obj)) {
    result = (
      <span>
        {obj.map((item, index) => {
          return (
            <span className="w-rjv-ellipsis-array-wrapper">
              <span className="w-rjv-ellipsis-value">{getSubValue(item)}</span>
              {index !== obj.length - 1 ? ', ' : ''}
            </span>
          );
        })}
      </span>
    );
  }
  console.log('result', result);
  return result;
}
export interface EllipsisProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  level: number;
  render?: (props: EllipsisProps) => JSX.Element;
}
export const Ellipsis: FC<PropsWithChildren<EllipsisProps>> = ({ style, render, count, level, ...props }) => {
  const styl = { cursor: 'pointer', ...style };
  const className = `w-rjv-ellipsis ${props.className || ''}`;
  if (render) return render({ style: styl, count, level, ...props, className });
  console.log('valueData', props.valueData);
  return (
    <span className={className} style={styl} {...props}>
      {/* {JSON.stringify(props.valueData).slice(1, -1)} */}
      {getEllipsisStr(props.valueData)}
    </span>
  );
};

Ellipsis.displayName = 'JVR.Ellipsis';
