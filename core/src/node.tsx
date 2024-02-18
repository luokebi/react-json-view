import { FC, Fragment, PropsWithChildren, useId, cloneElement, useState, useEffect, forwardRef } from 'react';
import { ValueView, Type, ValueViewProps, Colon, Label, LabelProps, Line, typeMap } from './value';
import { TriangleArrow } from './arrow/TriangleArrow';
import { useExpandsStatus, store } from './store';
import { JsonViewProps } from './';
import { Semicolon } from './semicolon';
import { Copied } from './copied';
import { Ellipsis } from './comps/ellipsis';
import { Meta } from './comps/meta';

function getLength<T extends object>(obj: T) {
  try {
    return Object.keys(obj).length;
  } catch (error) {
    return -1;
  }
}

export const CountInfo: FC<PropsWithChildren<LabelProps>> = ({ children }) => (
  <Label
    style={{ paddingLeft: 4, fontStyle: 'italic' }}
    color="var(--w-rjv-info-color, #0000004d)"
    className="w-rjv-object-size"
  >
    {children} items
  </Label>
);

CountInfo.displayName = 'JVR.CountInfo';

export interface RootNodeProps<T extends object> extends JsonViewProps<T> {
  keyName?: string | number;
  keyid?: string;
  level?: number;
  parentValue?: T;
  isSet?: boolean;
  isMap?: boolean;
  namespace?: Array<string | number>;
  setParentValue?: React.Dispatch<React.SetStateAction<T>>;
}

export const RootNode = forwardRef(
  <T extends object>(props: RootNodeProps<T>, ref: React.LegacyRef<HTMLDivElement>) => {
    const {
      value = {},
      keyName,
      className,
      displayDataTypes = true,
      components = {},
      displayObjectSize = true,
      enableClipboard = true,
      highlightUpdates = true,
      objectSortKeys = false,
      indentWidth = 15,
      shortenTextAfterLength = 30,
      collapsed,
      level = 1,
      keyid = 'root',
      quotes = '"',
      namespace = [],
      isSet = false,
      isMap = false,
      onCopied,
      onExpand,
      parentValue,
      setParentValue,
      ...reset
    } = props;
    const isArray = Array.isArray(value);
    const subkeyid = useId();
    const expands = useExpandsStatus();
    const expand =
      expands[keyid] ??
      (typeof collapsed === 'boolean' ? collapsed : typeof collapsed === 'number' ? level <= collapsed : true);
    const handle = () => {
      onExpand && typeof onExpand === 'function' && onExpand({ expand: !expand, keyid, keyName, value: value as T });
      !expand ? store.expand(keyid) : store.collapse(keyid);
    };
    const [valueData, setValueData] = useState<T>(value as T);
    const subNodeProps: Omit<RootNodeProps<T>, 'ref'> = {
      components,
      indentWidth,
      displayDataTypes,
      displayObjectSize,
      enableClipboard,
      highlightUpdates,
      onCopied,
      onExpand,
      collapsed,
      parentValue: value as T,
      setParentValue: setValueData,
      quotes,
      level: level + 1,
      style: { paddingLeft: indentWidth },
    };
    const valueViewProps = {
      displayDataTypes,
      displayObjectSize,
      enableClipboard,
      shortenTextAfterLength,
      level: level + 1,
      parentValue: value as T,
      indentWidth,
      data: valueData,
      quotes,
      setValue: setValueData,
    } as ValueViewProps<T>;
    const arrowStyle = { transform: `rotate(${expand ? '0' : '-90'}deg)`, transition: 'all 0.3s' };
    const arrowView = components.arrow ? (
      cloneElement(components.arrow, { style: arrowStyle, 'data-expand': expand, className: 'w-rjv-arrow' })
    ) : (
      <TriangleArrow style={arrowStyle} className="w-rjv-arrow" />
    );
    const [showTools, setShowTools] = useState(false);
    const eventProps: React.HTMLAttributes<HTMLDivElement> = {};
    if (enableClipboard) {
      eventProps.onMouseEnter = () => setShowTools(true);
      eventProps.onMouseLeave = () => setShowTools(false);
    }

    useEffect(() => setValueData(value as T), [value]);
    const nameKeys = (
      isArray ? Object.keys(valueData).map((m) => Number(m)) : Object.keys(valueData)
    ) as (keyof typeof valueData)[];

    // object
    let entries: [key: string | number, value: unknown][] = isArray
      ? Object.entries(valueData).map((m) => [Number(m[0]), m[1]])
      : Object.entries(valueData);
    if (objectSortKeys) {
      entries =
        objectSortKeys === true
          ? entries.sort(([a], [b]) => (typeof a === 'string' && typeof b === 'string' ? a.localeCompare(b) : 0))
          : entries.sort(([a], [b]) => (typeof a === 'string' && typeof b === 'string' ? objectSortKeys(a, b) : 0));
    }
    let countInfo: JSX.Element | undefined | null = <CountInfo>{nameKeys.length}</CountInfo>;
    if (components.countInfo) {
      countInfo = components.countInfo({ count: nameKeys.length, level, visible: expand }) || countInfo;
    }
    if (!displayObjectSize) countInfo = null;
    const countInfoExtra =
      components.countInfoExtra &&
      components.countInfoExtra({
        count: nameKeys.length,
        level,
        showTools,
        keyName,
        visible: expand,
        value: valueData,
        namespace: [...namespace],
        parentValue,
        setParentValue,
        setValue: setValueData,
      });
    return (
      <div ref={ref} {...reset} className={`${className} w-rjv-inner`} {...eventProps}>
        <Line style={{ display: 'inline-flex', alignItems: 'center' }} onClick={handle}>
          {arrowView}
          {(typeof keyName === 'string' || typeof keyName === 'number') && (
            <Fragment>
              <Semicolon
                value={valueData}
                quotes={quotes}
                data-keys={keyid}
                namespace={[...namespace]}
                render={components.objectKey}
                keyName={keyName}
                parentName={keyName}
                color={typeof keyName === 'number' ? typeMap['number'].color : ''}
              />
              <Colon />
            </Fragment>
          )}
          {isSet && <Type type="Set" />}
          {isMap && <Type type="Map" />}
          <Meta start isArray={isArray} level={level} render={components.braces} />
          {!expand && (
            <Ellipsis render={components.ellipsis} count={nameKeys.length} level={level} valueData={valueData} />
          )}
          {!expand && <Meta isArray={isArray} level={level} render={components.braces} />}
          {countInfo}
          {countInfoExtra}
          {enableClipboard && (
            <Copied show={showTools} text={valueData as T} onCopied={onCopied} render={components?.copied} />
          )}
        </Line>
        {expand && (
          <Line
            className="w-rjv-content"
            style={{
              borderLeft:
                'var(--w-rjv-border-left-width, 1px) var(--w-rjv-line-style, solid) var(--w-rjv-line-color, #ebebeb)',
              marginLeft: 6,
            }}
          >
            {entries.length > 0 &&
              [...entries].map(([key, itemVal], idx) => {
                const item = itemVal as T;
                const isMySet = item instanceof Set;
                const isMyMap = item instanceof Map;
                let myValue = isMySet ? Array.from(item as Set<any>) : isMyMap ? Object.fromEntries(item) : item;
                const isEmpty =
                  (Array.isArray(myValue) && (myValue as []).length === 0) ||
                  (typeof myValue === 'object' &&
                    myValue &&
                    !((myValue as any) instanceof Date) &&
                    Object.keys(myValue).length === 0);
                if ((Array.isArray(myValue) || isMySet || isMyMap) && !isEmpty) {
                  const label = (isArray ? idx : key) as string;
                  return (
                    <Line key={label + idx} className="w-rjv-wrap">
                      <RootNode
                        value={myValue}
                        isSet={isMySet}
                        isMap={isMyMap}
                        namespace={[...namespace, label]}
                        keyName={label}
                        keyid={keyid + subkeyid + label}
                        {...(subNodeProps as any)}
                      />
                    </Line>
                  );
                }
                if (typeof myValue === 'object' && myValue && !((myValue as any) instanceof Date) && !isEmpty) {
                  return (
                    <Line key={key + '' + idx} className="w-rjv-wrap">
                      <RootNode
                        value={myValue}
                        namespace={[...namespace, key]}
                        keyName={key}
                        keyid={keyid + subkeyid + key}
                        {...(subNodeProps as any)}
                      />
                    </Line>
                  );
                }
                if (typeof myValue === 'function') {
                  return;
                }
                const renderKey = (
                  <Semicolon
                    value={myValue}
                    data-keys={keyid}
                    quotes={quotes}
                    namespace={[...namespace, key]}
                    parentName={keyName}
                    highlightUpdates={highlightUpdates}
                    render={components.objectKey}
                    color={typeof key === 'number' ? typeMap['number'].color : ''}
                    keyName={key}
                  />
                );
                const length = Array.isArray(myValue) ? myValue.length : getLength(myValue);
                countInfo = <CountInfo>{length}</CountInfo>;
                if (components.countInfo) {
                  countInfo = components.countInfo({ count: length, level, visible: expand }) || countInfo;
                }
                return (
                  <ValueView
                    key={idx}
                    components={components}
                    namespace={[...namespace, key]}
                    {...valueViewProps}
                    countInfo={countInfo}
                    renderKey={renderKey}
                    keyName={key}
                    isSet={isSet}
                    value={myValue}
                  />
                );
              })}
          </Line>
        )}
        {expand && (
          <Line style={{ paddingLeft: 2 }}>
            <Meta
              render={components.braces}
              isArray={isArray}
              level={level}
              style={{ paddingLeft: 2, display: 'inline-block' }}
            />
          </Line>
        )}
      </div>
    );
  },
);

RootNode.displayName = 'JVR.RootNode';
